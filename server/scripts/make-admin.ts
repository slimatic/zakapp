import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address');
        process.exit(1);
    }

    console.log(`Promoting user ${email} to ADMIN_USER...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { userType: 'ADMIN_USER' },
        });
        console.log(`Success! User ${user.username} (${user.email}) is now an ADMIN_USER.`);
    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
