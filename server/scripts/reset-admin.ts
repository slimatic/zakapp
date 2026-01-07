
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const targetEmail = 'agent_local_debug@slimatic.net';
    const newUsername = 'slimatic';
    const newPassword = 'password123';

    console.log(`Searching for user with email: ${targetEmail}`);
    const user = await prisma.user.findFirst({
        where: { email: targetEmail }
    });

    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log(`Updating user ${user.id}...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            username: newUsername,
            passwordHash: passwordHash,
            userType: 'ADMIN_USER' // ensure admin
        }
    });

    console.log(`User updated. Login with username '${newUsername}' and password '${newPassword}'.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
