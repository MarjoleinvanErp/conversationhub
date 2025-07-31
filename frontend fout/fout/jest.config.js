module.exports = { 
  preset: 'ts-jest', 
  testEnvironment: 'jsdom', 
  setupFilesAfterEnv: ['./tests/utils/setupTests.ts'], 
  moduleNameMapping: { 
    '@/(.*)': './src/$1', 
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy' 
  }, 
  testMatch: [ 
    './tests/**/*.(test|spec).(ts|tsx|js|jsx)', 
    './src/**/*.(test|spec).(ts|tsx|js|jsx)' 
  ], 
  collectCoverageFrom: [ 
    'src/**/*.(ts|tsx|js|jsx)', 
    '!src/**/*.d.ts', 
    '!src/main.tsx' 
  ], 
  coverageDirectory: 'coverage', 
  testTimeout: 10000 
}; 
