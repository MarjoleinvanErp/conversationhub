@echo off
echo Fixing Jest configuration...

cd /d "C:\conversationhub\frontend"

echo [STAP 5] Jest configuratie maken...

(
echo module.exports = {
echo   preset: 'ts-jest',
echo   testEnvironment: 'jsdom',
echo   setupFilesAfterEnv: ['^<rootDir^>/tests/utils/setupTests.ts'],
echo   moduleNameMapping: {
echo     '^@/(.*)': '^<rootDir^>/src/^$1',
echo     '\.(css^|less^|scss^|sass)': 'identity-obj-proxy'
echo   },
echo   testMatch: [
echo     '^<rootDir^>/tests/**/*.(test^|spec).(ts^|tsx^|js^|jsx)',
echo     '^<rootDir^>/src/**/*.(test^|spec).(ts^|tsx^|js^|jsx)'
echo   ],
echo   collectCoverageFrom: [
echo     'src/**/*.(ts^|tsx^|js^|jsx)',
echo     '!src/**/*.d.ts',
echo     '!src/main.tsx',
echo     '!src/vite-env.d.ts'
echo   ],
echo   coverageDirectory: 'coverage',
echo   coverageReporters: ['text', 'lcov', 'html'],
echo   transform: {
echo     '^.+\.(ts^|tsx)': 'ts-jest'
echo   },
echo   moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
echo   testTimeout: 10000
echo };
) > jest.config.js

echo ✅ Jest configuratie gemaakt

echo.
echo [STAP 6] Playwright configuratie...

(
echo import { defineConfig, devices } from '@playwright/test';
echo.
echo export default defineConfig({
echo   testDir: './tests/e2e',
echo   fullyParallel: true,
echo   forbidOnly: !!process.env.CI,
echo   retries: process.env.CI ? 2 : 0,
echo   workers: process.env.CI ? 1 : undefined,
echo   reporter: 'html',
echo   use: {
echo     baseURL: 'http://localhost:3000',
echo     trace: 'on-first-retry',
echo     screenshot: 'only-on-failure',
echo     video: 'retain-on-failure'
echo   },
echo   projects: [
echo     {
echo       name: 'chromium',
echo       use: { ...devices['Desktop Chrome'] },
echo     },
echo     {
echo       name: 'firefox',
echo       use: { ...devices['Desktop Firefox'] },
echo     },
echo     {
echo       name: 'webkit',
echo       use: { ...devices['Desktop Safari'] },
echo     }
echo   ],
echo   webServer: {
echo     command: 'npm run dev',
echo     url: 'http://localhost:3000',
echo     reuseExistingServer: !process.env.CI,
echo     timeout: 120 * 1000,
echo   },
echo });
) > playwright.config.ts

echo ✅ Playwright configuratie gemaakt

echo.
echo [STAP 7] Vite configuratie...

(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo import { resolve } from 'path'
echo.
echo export default defineConfig({
echo   plugins: [react()],
echo   server: {
echo     port: 3000,
echo     host: true,
echo   },
echo   css: {
echo     postcss: './postcss.config.js',
echo   },
echo   resolve: {
echo     alias: {
echo       '@': resolve(__dirname, './src'),
echo       '@/components': resolve(__dirname, './src/components'),
echo       '@/pages': resolve(__dirname, './src/pages'),
echo       '@/hooks': resolve(__dirname, './src/hooks'),
echo       '@/contexts': resolve(__dirname, './src/contexts'),
echo       '@/services': resolve(__dirname, './src/services'),
echo       '@/types': resolve(__dirname, './src/types'),
echo       '@/utils': resolve(__dirname, './src/utils'),
echo       '@/styles': resolve(__dirname, './src/styles'),
echo     },
echo   },
echo   optimizeDeps: {
echo     include: ['react', 'react-dom', 'axios', '@mui/material', '@emotion/react', '@emotion/styled'],
echo   },
echo   build: {
echo     target: 'es2020',
echo     outDir: 'dist',
echo     sourcemap: true,
echo     rollupOptions: {
echo       output: {
echo         manualChunks: {
echo           vendor: ['react', 'react-dom'],
echo           mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
echo           utils: ['axios', '@tanstack/react-query'],
echo         },
echo       },
echo     },
echo   },
echo })
) > vite.config.ts

echo ✅ Vite configuratie gemaakt

echo.
echo [STAP 8] Overige configuraties...

:: Tailwind en PostCSS
(
echo export default {
echo   plugins: {
echo     tailwindcss: {},
echo     autoprefixer: {},
echo   },
echo }
) > postcss.config.js

(
echo /** @type {import('tailwindcss').Config} */
echo export default {
echo   content: [
echo     "./index.html",
echo     "./src/**/*.{js,ts,jsx,tsx}",
echo   ],
echo   theme: {
echo     extend: {
echo       colors: {
echo         primary: {
echo           50: '#eff6ff',
echo           100: '#dbeafe',
echo           500: '#3b82f6',
echo           600: '#2563eb',
echo           700: '#1d4ed8',
echo         },
echo         secondary: {
echo           50: '#ecfdf5',
echo           100: '#d1fae5',
echo           500: '#10b981',
echo           600: '#059669',
echo           700: '#047857',
echo         },
echo         conversation: {
echo           bg: '#f8fafc',
echo           card: '#ffffff',
echo           text: '#1e293b',
echo           muted: '#64748b',
echo           border: '#e2e8f0',
echo         }
echo       }
echo     },
echo   },
echo   plugins: [],
echo }
) > tailwind.config.js

echo ✅ Configuratie bestanden gemaakt

echo.
echo [STAP 9] HTML template...

(
echo ^<!DOCTYPE html^>
echo ^<html lang="nl"^>
echo   ^<head^>
echo     ^<meta charset="UTF-8" /^>
echo     ^<link rel="icon" type="image/svg+xml" href="/favicon.ico" /^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
echo     ^<title^>ConversationHub^</title^>
echo   ^</head^>
echo   ^<body^>
echo     ^<div id="root"^>^</div^>
echo     ^<script type="module" src="/src/main.tsx"^>^</script^>
echo   ^</body^>
echo ^</html^>
) > index.html

echo ✅ HTML template gemaakt

echo.
echo Dependencies installeren...
echo 📦 npm install...
call npm install

echo.
echo ============================================
echo ✅ CONFIGURATIE HERSTELD!
echo ============================================
echo.
echo 🚀 Test de setup:
echo    npm run dev
echo    npm test  
echo    npm run e2e
echo.
pause