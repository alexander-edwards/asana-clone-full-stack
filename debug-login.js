// Debug script to test the login flow
const axios = require('axios');

async function testLoginFlow() {
  const API_URL = 'https://asana-backend-new-morphvm-s6un9i69.http.cloud.morph.so';
  
  console.log('Testing Login Flow...\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('   Health check:', healthResponse.data);
    
    // 2. Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'demo@asanaclone.com',
      password: 'Demo123456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://asana-frontend-morphvm-s6un9i69.http.cloud.morph.so'
      }
    });
    
    console.log('   Login successful!');
    console.log('   Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('   User:', loginResponse.data.user);
    
    // 3. Test authenticated endpoint
    console.log('\n3. Testing authenticated endpoint...');
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('   Auth check successful!');
    console.log('   User data:', meResponse.data);
    
    // 4. Test getting projects
    console.log('\n4. Testing projects endpoint...');
    const projectsResponse = await axios.get(`${API_URL}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('   Projects fetched:', projectsResponse.data);
    
    console.log('\n✅ All API tests passed! The backend is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

testLoginFlow();
