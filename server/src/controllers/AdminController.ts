import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { DEFAULT_LIMITS } from '../config/limits';
import { revokeToken } from '../routes/auth/_shared';

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const getStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();

        // `isActive` is the account state an admin actually toggles, so the tiles
        // count it. They previously counted login recency inside 30 days, which is
        // a different question ("has logged in recently") and left the two tiles
        // unrelated to the Active/Inactive badges in the user list right beside
        // them. Recency is still visible per user as Last Login.
        const activeUsers = await prisma.user.count({
            where: { isActive: true }
        });

        const dormantUsers = await prisma.user.count({
            where: { isActive: false }
        });

        // Storage stats would require querying CouchDB or disk
        // For now, returning placeholder or basic DB stats if possible

        // The stats payload belongs under `data`, like every other admin endpoint
        // (settings, system/status, users all return `res.json({ success, data })`).
        // This one alone returned a top-level `stats`, so the client's
        // `statsRes.data?.stats` resolved to undefined and /admin rendered
        // "Unexpected Error" with the app otherwise healthy. Keeping the envelope
        // uniform is what makes one client convention work for all of them.
        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    dormantUsers,
                    storageUsed: 'N/A' // Placeholder
                }
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

import { getUserCouchDBStats } from '../utils/couchStats';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const skip = (page - 1) * limit;

        // Sorting is server-side on purpose: the list is paginated, so sorting the
        // 10 rows already on screen would reorder one page and leave the rest
        // unreachable. The fields are an allow-list because Prisma rejects an
        // unknown orderBy with a 500 rather than falling back to the default.
        const sortable = {
            createdAt: 'createdAt',
            lastLoginAt: 'lastLoginAt',
            email: 'email',
            username: 'username',
            userType: 'userType',
            isActive: 'isActive'
        } as const;
        const sortBy = sortable[req.query.sortBy as keyof typeof sortable] || 'createdAt';
        const orderBy: Prisma.UserOrderByWithRelationInput = {
            [sortBy]: req.query.sortDir === 'asc' ? 'asc' : 'desc'
        };

        const whereClause: Prisma.UserWhereInput = {};
        if (search) {
            whereClause.OR = [
                { email: { contains: search } },
                { username: { contains: search } }
            ];
        }

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    userType: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    maxAssets: true,
                    maxNisabRecords: true,
                    maxPayments: true,
                    maxLiabilities: true,
                    isVerified: true
                }
            }),
            prisma.user.count({ where: whereClause })
        ]);

        // Enrich with CouchDB Stats
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const stats = await getUserCouchDBStats(user.id);
            return {
                ...user,
                _count: {
                    assets: stats.assets,
                    liabilities: stats.liabilities,
                    yearlySnapshots: stats.nisabRecords,
                    payments: stats.payments
                }
            };
        }));

        res.json({
            success: true,
            data: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: id as string } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent deleting self (if needed) but admin might want to.

        // Delete user
        await prisma.user.delete({ where: { id: id as string } });

        // TODO: Trigger cleanup of CouchDB user database if applicable

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['USER', 'ADMIN_USER'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role provided' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: id as string } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent self-demotion for safety
        const currentAdminId = req.userId;
        if (id === currentAdminId && role === 'USER') { // Basic check, relies on auth middleware populating userId
            return res.status(400).json({ success: false, error: 'Cannot demote your own account' });
        }

        await prisma.user.update({
            where: { id: id as string },
            data: { userType: role }
        });

        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const updateUserLimits = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { maxAssets, maxNisabRecords, maxPayments } = req.body;

        const data: Prisma.UserUpdateInput = {};
        if (maxAssets !== undefined) data.maxAssets = maxAssets === null ? null : Number(maxAssets);
        if (maxNisabRecords !== undefined) data.maxNisabRecords = maxNisabRecords === null ? null : Number(maxNisabRecords);
        if (maxPayments !== undefined) data.maxPayments = maxPayments === null ? null : Number(maxPayments);
        if (req.body.maxLiabilities !== undefined) data.maxLiabilities = req.body.maxLiabilities === null ? null : Number(req.body.maxLiabilities);

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: id as string } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        await prisma.user.update({
            where: { id: id as string },
            data
        });

        res.json({ success: true, message: 'User limits updated successfully' });
    } catch (error) {
        console.error('Error updating user limits:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const updateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
        }

        const user = await prisma.user.findUnique({ where: { id: id as string } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Self-lockout guard. An admin whose address is in ADMIN_EMAILS holds admin
        // access independently of the DB row, but deactivating the account still
        // blocks their own login, and there is no route back through the UI.
        // Mirrors the self-demotion guard on the role route.
        if (id === req.userId && isActive === false) {
            return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
        }

        await prisma.user.update({
            where: { id: id as string },
            data: { isActive }
        });

        // Deactivation must END the sessions that are already open, or a live tab
        // keeps working for the life of its access token and the toggle is display
        // -only. The token denylist is in-memory (see routes/auth/_shared), so this
        // only reaches sessions revoked after the process started; it is the same
        // durability the existing logout path has.
        if (isActive === false) {
            const sessions = await prisma.userSession.findMany({
                where: { userId: id as string, isActive: true },
                select: { accessToken: true }
            });
            for (const session of sessions) {
                if (session.accessToken) revokeToken(session.accessToken);
            }
            await prisma.userSession.updateMany({
                where: { userId: id as string, isActive: true },
                data: { isActive: false }
            });
        }

        res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const updateAllUserLimits = async (req: Request, res: Response) => {
    try {
        const body = req.body as Record<string, unknown>;

        // Raise the stored default for every user who has never been given an
        // individual override, including null (no value set) so it self-heals.
        //
        // Deliberately a FLOOR, never a clamp: `lt` is strictly-less-than, so a
        // user already above the new value is left alone. Raising the account-wide
        // default must not take capacity away from anyone who already had more.
        const targets: Array<[string, number]> = [];
        const field = (name: keyof typeof DEFAULT_LIMITS, incoming: unknown) =>
            typeof incoming === 'number' && Number.isInteger(incoming) && incoming >= 0
                ? targets.push([name as string, incoming])
                : null;

        field('MAX_ASSETS', body.maxAssets);
        field('MAX_NISAB_RECORDS', body.maxNisabRecords);
        field('MAX_PAYMENTS', body.maxPayments);
        field('MAX_LIABILITIES', body.maxLiabilities);

        if (targets.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid limit values provided' });
        }

        for (const [name, value] of targets) {
            const column = name === 'MAX_ASSETS' ? 'maxAssets'
                : name === 'MAX_NISAB_RECORDS' ? 'maxNisabRecords'
                : name === 'MAX_PAYMENTS' ? 'maxPayments' : 'maxLiabilities';
            await prisma.user.updateMany({
                where: { OR: [{ [column]: null }, { [column]: { lt: value } }] },
                data: { [column]: value }
            });
        }

        res.json({ success: true, message: `Default limits raised for all users (${targets.map(([n]) => n).join(', ')})` });
    } catch (error) {
        console.error('Error updating all user limits:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
