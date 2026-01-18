import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
        console.error('Usage: npx ts-node scripts/reset-password.ts <email> <newPassword>');
        process.exit(1);
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        // Hash the new password using the standardized bcryptjs configuration
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { email },
            data: { passwordHash },
        });

        console.log(`✅ Password for ${email} has been successfully reset.`);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
