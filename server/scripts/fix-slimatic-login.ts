
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const targetUsername = 'slimatic';
    const newPassword = 'SecurePass123!';

    console.log(`Searching for user with username: ${targetUsername}`);
    const user = await prisma.user.findUnique({
        where: { username: targetUsername }
    });

    if (!user) {
        console.log('User with username "slimatic" not found.');
        // Check if we can find by email and set username
        const emailUser = await prisma.user.findFirst({
            where: { email: { contains: 'slimatic' } }
        });
        if (emailUser) {
            console.log(`Found user by email: ${emailUser.email} (username: ${emailUser.username})`);
            // If this user has a different username, we might want to just use this one.
        }
        return;
    }

    console.log(`Found user ${user.id} (${user.email}). Updating password...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: passwordHash,
            userType: 'ADMIN_USER' // Ensure they are admin for now to test
        }
    });

    console.log(`User "slimatic" updated. Password set to "${newPassword}".`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
