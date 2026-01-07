
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB at:', process.env.DATABASE_URL);
    try {
        const userCount = await prisma.user.count();
        console.log(`Total users in DB: ${userCount}`);
    } catch (e) { console.error('Failed to count users:', e); }

    const username = 'slimatic';
    const email = 'slimatic@zakapp.com'; // Dummy email if needed
    const password = 'password123';

    console.log(`Checking for user: ${username}`);
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: username },
                { email: { contains: 'slimatic' } } // loose match for existing email
            ]
        }
    });

    if (existingUser) {
        console.log(`User found: ${existingUser.username} (${existingUser.email})`);
        if (existingUser.userType === 'ADMIN_USER') {
            console.log('User is already ADMIN_USER.');
        } else {
            console.log('Promoting user to ADMIN_USER...');
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { userType: 'ADMIN_USER' } // @ts-ignore
            });
            console.log('User promoted.');
        }
    } else {
        console.log(`User not found. Creating new user '${username}' as ADMIN_USER...`);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                userType: 'ADMIN_USER' // @ts-ignore
            }
        });
        console.log(`User created. Login with username '${username}' and password '${password}'.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
