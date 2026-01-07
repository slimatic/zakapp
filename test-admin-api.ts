
const fetch = require('node-fetch');

async function main() {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'slimatic', password: 'password123' })
    });

    const loginData = await loginRes.json();
    console.log('Login success:', loginData.success);
    if (!loginData.success) {
        console.log(loginData);
        return;
    }

    const token = loginData.accessToken;
    console.log('Token obtained');

    const statsRes = await fetch('http://localhost:3001/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const statsData = await statsRes.json();
    console.log('Stats response:', JSON.stringify(statsData, null, 2));

    const usersRes = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const usersData = await usersRes.json();
    console.log('Users response:', JSON.stringify(usersData, null, 2));
}

main().catch(console.error);
