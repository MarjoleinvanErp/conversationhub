// frontend/src/test-utils/globalSetup.ts

export default async function globalSetup() {
  // Global setup before all tests
  console.log('🧪 Setting up Jest test environment...');
  
  // Set timezone for consistent date testing
  process.env.TZ = 'UTC';
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_API_BASE_URL = 'http://localhost:8000/api';
}