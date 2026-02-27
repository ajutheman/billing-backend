const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function test() {
    try {
        console.log('1. Registering User...');
        const reg = await axios.post(`${BASE_URL}/auth/register`, {
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com'
        });
        console.log('Register Response:', reg.data);

        console.log('\n2. Logging in...');
        const login = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'testuser',
            password: 'password123'
        });
        const token = login.data.token;
        console.log('Login Success! Token received.');

        console.log('\n3. Testing Protected PULL Endpoint...');
        const pull = await axios.post(`${BASE_URL}/sync/pull`, {
            last_sync_time: 0
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Pull Response:', pull.data);

        console.log('\n4. Testing Un-authenticated PULL (Should Fail)...');
        try {
            await axios.post(`${BASE_URL}/sync/pull`, { last_sync_time: 0 });
        } catch (e) {
            console.log('Caught expected error:', e.response.status);
        }

    } catch (e) {
        if (e.response) {
            console.error('API Error:', e.response.data);
        } else {
            console.error('Error:', e.message);
        }
    }
}

test();
