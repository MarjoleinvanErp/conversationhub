module.exports = { 
  preset: 'ts-jest', 
  testEnvironment: 'jsdom', 
  testMatch: [ 
    '**/__tests__/**/*.{js,jsx,ts,tsx}', 
    '**/*.(test|spec).{js,jsx,ts,tsx}' 
  ], 
  transform: { 
    '.+\\.(ts|tsx)?$': 'ts-jest', 
    '.+\\.(js|jsx)$': 'babel-jest', 
  }, 
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], 
  moduleNameMapping: { 
  }, 
  setupFilesAfterEnv: ['@testing-library/jest-dom'], 
  testPathIgnorePatterns: [ 
  ], 
  collectCoverageFrom: [ 
    'src/**/*.{ts,tsx}', 
    '!src/**/*.d.ts', 
    '!src/index.tsx', 
  ], 
}; 
