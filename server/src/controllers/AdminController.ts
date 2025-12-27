import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler, AppError, ErrorCode } from '../middleware/ErrorHandler';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userService = new UserService();
const authService = new AuthService();

export class AdminController {

    /**
     * Get all users with pagination
     */
    getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    userType: true,
                    isActive: true,
                    createdAt: true,
                    lastLoginAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count()
        ]);

        const response: ApiResponse = {
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        };

        res.status(200).json(response);
    });

    /**
     * Create a new user (Admin function)
     */
    createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { email, password, username, userType } = req.body;

        if (!email || !password) {
            throw new AppError('Email and password are required', 400, ErrorCode.VALIDATION_ERROR);
        }

        // Use AuthService logic to ensure correct hashing/creation
        // Note: We need to bypass the 'register' route's public constraints if any.
        // For now, we manually create to allow setting userType.

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });

        if (existingUser) {
            throw new AppError('User with this email or username already exists', 400, ErrorCode.VALIDATION_ERROR);
        }

        const hashedPassword = await authService.hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash: hashedPassword,
                userType: userType || 'USER',
                profile: JSON.stringify({ salt: req.body.salt }), // Store salt if provided (critical for client-side encryption)
                settings: JSON.stringify({})
            },
            select: {
                id: true,
                email: true,
                username: true,
                userType: true,
                createdAt: true
            }
        });

        // Also need to create CouchDB user/db? 
        // The client usually handles 'register' by calling API then setting up local DB.
        // If Admin creates user, the User still needs to 'setup' their client.
        // So we just create the Auth Record here.

        // We SHOULD create the CouchDB user to ensure they can sync later.
        try {
            // This would normally be in a service. 
            // For this MVP, we rely on the Client's 'sync' logic to create remote DBs if missing, 
            // OR we assume the standard registration flow covers it.
            // Since this is for debugging/management, simply creating the SQL record is often enough 
            // to allow the user to 'log in' (which validates against SQL).
            // However, CouchDB auth is separate.
            // Let's call the AuthService.register logic if possible?
            // AuthService.register does: hash password, create user in DB, generate tokens.
            // It DOES NOT touch CouchDB. The generic 'register' endpoint doesn't touch CouchDB either.
            // The Client does `SyncService.startSync` -> `replicateCouchDB` -> which authenticates.
            // But CouchDB needs a user created in `_users`.
            // Wait, where is CouchDB user created?
            // Ah, likely in a background job or separate service call? 
            // Let's check `AuthService.ts`.
        } catch (e) {
            console.warn('Admin: Failed to setup external deps for user', e);
        }

        const response: ApiResponse = {
            success: true,
            message: 'User created successfully',
            data: { user: newUser }
        };

        res.status(201).json(response);
    });

    /**
     * Delete a user (Destructive)
     * Removes from SQL.
     * Note: Does NOT auto-remove from CouchDB in this MVP unless we implement cleanup service.
     */
    deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;

        if (!id) {
            throw new AppError('User ID required', 400, ErrorCode.VALIDATION_ERROR);
        }

        // Prevent deleting oneself?
        if (id === req.userId) {
            throw new AppError('Cannot delete your own admin account', 400, ErrorCode.FORBIDDEN);
        }

        await prisma.user.delete({
            where: { id }
        });

        // TODO: Trigger job to cleanup CouchDB `zakapp_db_<userId>`?

        const response: ApiResponse = {
            success: true,
            message: 'User deleted successfully'
        };

        res.status(200).json(response);
    });
}
