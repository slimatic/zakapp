
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getStats = async (req: Request, res: Response) => {
    try {
        console.log('AdminController.getStats called'); // DEBUG
        const totalUsers = await prisma.user.count();
        console.log('Total users count result:', totalUsers); // DEBUG

        // Active users: logged in within last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await prisma.user.count({
            where: {
                lastLoginAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        const dormantUsers = await prisma.user.count({
            where: {
                OR: [
                    { lastLoginAt: null },
                    { lastLoginAt: { lt: thirtyDaysAgo } }
                ]
            }
        });

        // Storage stats would require querying CouchDB or disk
        // For now, returning placeholder or basic DB stats if possible

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                dormantUsers,
                storageUsed: 'N/A' // Placeholder
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const skip = (page - 1) * limit;

        const whereClause: any = {};
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
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    userType: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true
                }
            }),
            prisma.user.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            data: users,
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
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent deleting self (if needed) but admin might want to.

        // Delete user
        await prisma.user.delete({ where: { id } });

        // TODO: Trigger cleanup of CouchDB user database if applicable

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['USER', 'ADMIN_USER'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role provided' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent self-demotion for safety
        const currentAdminId = (req as any).userId;
        if (id === currentAdminId && role === 'USER') { // Basic check, relies on auth middleware populating userId
            return res.status(400).json({ success: false, error: 'Cannot demote your own account' });
        }

        await prisma.user.update({
            where: { id },
            data: { userType: role }
        });

        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
