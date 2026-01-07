
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const targetUsername = 'slimatic';
    const newPassword = 'password123';

    console.log(`Searching for user with username: ${targetUsername}`);
    const user = await prisma.user.findFirst({
        where: { username: targetUsername }
    });

    if (!user) {
        console.log('User not found by username. Trying email...');
        // ... fallback logic if needed
        return;
    }

    console.log(`Found user ${user.id} (${user.email}). Updating...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: passwordHash,
            userType: 'ADMIN_USER'
        }
    });

    console.log(`User updated. Login with username '${targetUsername}' and password '${newPassword}'.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
