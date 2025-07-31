@echo off
echo ============================================
echo ConversationHub Frontend Complete Restructure
echo Clean setup + React best practices + Testing
echo ============================================
echo.

set PROJECT_ROOT=C:\conversationhub\frontend
set TIMESTAMP=%date:~-4,4%-%date:~-7,2%-%date:~-10,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

cd /d "%PROJECT_ROOT%"

echo 📁 Project Root: %PROJECT_ROOT%
echo 🕐 Timestamp: %TIMESTAMP%
echo.

echo ⚠️  Dit script zal:
echo   🧹 Alle huidige bestanden naar backup verplaatsen
echo   🏗️  Nieuwe proper React directory structuur maken
echo   🧪 TypeScript + Jest + Playwright setup
echo   📝 Basis bestanden met clean code
echo   🎨 Material-UI components hernoemen naar generic names
echo.
set /p confirm=Type 'YES' om door te gaan: 

if not "%confirm%"=="YES" (
    echo ❌ Gestopt
    pause
    exit /b 0
)

echo.
echo [STAP 1] Backup maken van huidige setup...

:: Maak nieuwe backup met timestamp
set CURRENT_BACKUP=backup-current-%TIMESTAMP%
mkdir "%CURRENT_BACKUP%"

:: Verplaats alles naar backup behalve backup directories
for /f "delims=" %%i in ('dir /b') do (
    if /i not "%%i"=="backup-temp" if /i not "%%i"=="backup-temp-old" if /i not "%%i"=="%CURRENT_BACKUP%" if /i not "%%i"=="complete-restructure.bat" (
        echo 📦 Backup: %%i
        move "%%i" "%CURRENT_BACKUP%\%%i" >nul 2>&1
    )
)
echo ✅ Backup gemaakt in %CURRENT_BACKUP%

echo.
echo [STAP 2] Nieuwe directory structuur maken...

:: Maak basis directories
mkdir src
mkdir src\components
mkdir src\components\common
mkdir src\components\forms
mkdir src\components\ui
mkdir src\layouts
mkdir src\layouts\components
mkdir src\pages
mkdir src\pages\auth
mkdir src\pages\dashboard
mkdir src\pages\meetings
mkdir src\pages\settings
mkdir src\hooks
mkdir src\contexts
mkdir src\services
mkdir src\services\api
mkdir src\types
mkdir src\utils
mkdir src\styles
mkdir public
mkdir tests
mkdir tests\unit
mkdir tests\integration
mkdir tests\e2e
mkdir tests\fixtures
mkdir tests\utils

echo ✅ Directory structuur aangemaakt

echo.
echo [STAP 3] Package.json met dependencies maken...

(
echo {
echo   "name": "conversationhub-frontend",
echo   "private": true,
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "tsc && vite build",
echo     "preview": "vite preview",
echo     "lint": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0",
echo     "lint:fix": "eslint . --ext js,jsx,ts,tsx --fix",
echo     "type-check": "tsc --noEmit",
echo     "test": "jest",
echo     "test:watch": "jest --watch",
echo     "test:coverage": "jest --coverage",
echo     "test:unit": "jest tests/unit",
echo     "test:integration": "jest tests/integration",
echo     "e2e": "playwright test",
echo     "e2e:ui": "playwright test --ui",
echo     "e2e:headed": "playwright test --headed",
echo     "e2e:debug": "playwright test --debug",
echo     "test:install": "playwright install",
echo     "test:all": "npm run test && npm run e2e"
echo   },
echo   "dependencies": {
echo     "@emotion/react": "^11.11.1",
echo     "@emotion/styled": "^11.11.0",
echo     "@mui/icons-material": "^5.15.1",
echo     "@mui/material": "^5.15.1",
echo     "@tanstack/react-query": "^5.12.2",
echo     "axios": "^1.6.2",
echo     "lucide-react": "^0.525.0",
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-router-dom": "^6.20.1"
echo   },
echo   "devDependencies": {
echo     "@playwright/test": "^1.53.2",
echo     "@testing-library/jest-dom": "^6.6.3",
echo     "@testing-library/react": "^14.3.1",
echo     "@testing-library/user-event": "^14.6.1",
echo     "@types/dom-mediacapture-record": "^1.0.22",
echo     "@types/jest": "^29.5.14",
echo     "@types/node": "^20.19.2",
echo     "@types/react": "^18.2.43",
echo     "@types/react-dom": "^18.2.17",
echo     "@vitejs/plugin-react": "^4.2.1",
echo     "autoprefixer": "^10.4.16",
echo     "eslint": "^8.55.0",
echo     "eslint-plugin-react": "^7.33.2",
echo     "eslint-plugin-react-hooks": "^4.6.0",
echo     "eslint-plugin-react-refresh": "^0.4.5",
echo     "jest": "^29.7.0",
echo     "jest-environment-jsdom": "^29.7.0",
echo     "postcss": "^8.4.32",
echo     "tailwindcss": "^3.3.6",
echo     "ts-jest": "^29.4.0",
echo     "typescript": "^5.8.3",
echo     "vite": "^5.0.8"
echo   }
echo }
) > package.json

echo ✅ package.json gemaakt

echo.
echo [STAP 4] TypeScript configuratie...

:: tsconfig.json
(
echo {
echo   "compilerOptions": {
echo     "target": "ES2020",
echo     "useDefineForClassFields": true,
echo     "lib": ["ES2020", "DOM", "DOM.Iterable"],
echo     "module": "ESNext",
echo     "skipLibCheck": true,
echo     "moduleResolution": "bundler",
echo     "allowImportingTsExtensions": true,
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "noEmit": true,
echo     "jsx": "react-jsx",
echo     "strict": true,
echo     "noUnusedLocals": true,
echo     "noUnusedParameters": true,
echo     "noFallthroughCasesInSwitch": true,
echo     "baseUrl": ".",
echo     "paths": {
echo       "@/*": ["./src/*"],
echo       "@/components/*": ["./src/components/*"],
echo       "@/pages/*": ["./src/pages/*"],
echo       "@/hooks/*": ["./src/hooks/*"],
echo       "@/contexts/*": ["./src/contexts/*"],
echo       "@/services/*": ["./src/services/*"],
echo       "@/types/*": ["./src/types/*"],
echo       "@/utils/*": ["./src/utils/*"],
echo       "@/styles/*": ["./src/styles/*"]
echo     }
echo   },
echo   "include": ["src", "tests"],
echo   "references": [{ "path": "./tsconfig.node.json" }]
echo }
) > tsconfig.json

:: tsconfig.node.json
(
echo {
echo   "compilerOptions": {
echo     "composite": true,
echo     "skipLibCheck": true,
echo     "module": "ESNext",
echo     "moduleResolution": "bundler",
echo     "allowSyntheticDefaultImports": true,
echo     "strict": true
echo   },
echo   "include": ["vite.config.ts", "tests/**/*"]
echo }
) > tsconfig.node.json

echo ✅ TypeScript configuratie gemaakt

echo.
echo [STAP 5] Jest configuratie...

(
echo module.exports = {
echo   preset: 'ts-jest',
echo   testEnvironment: 'jsdom',
echo   setupFilesAfterEnv: ['<rootDir>/tests/utils/setupTests.ts'],
echo   moduleNameMapping: {
echo     '^@/(.*)$': '<rootDir>/src/$1',
echo     '\\.(css^|less^|scss^|sass)$': 'identity-obj-proxy'
echo   },
echo   testMatch: [
echo     '<rootDir>/tests/**/*.(test^|spec).(ts^|tsx^|js^|jsx)',
echo     '<rootDir>/src/**/*.(test^|spec).(ts^|tsx^|js^|jsx)'
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
echo     '^.+\\.(ts^|tsx)$': 'ts-jest'
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
echo [STAP 8] Tailwind en PostCSS configuratie...

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

echo ✅ Tailwind configuratie gemaakt

echo.
echo [STAP 9] Basis HTML template...

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
echo [STAP 10] TypeScript types maken...

(
echo // ConversationHub TypeScript Definitions
echo // Auto-generated by restructure script
echo.
echo export interface User {
echo   id: string;
echo   name: string;
echo   email: string;
echo   role: 'admin' ^| 'user' ^| 'guest';
echo   organization_id: string;
echo   created_at: string;
echo   updated_at: string;
echo }
echo.
echo export interface Meeting {
echo   id: string;
echo   title: string;
echo   description?: string;
echo   status: 'scheduled' ^| 'active' ^| 'completed' ^| 'cancelled';
echo   type: string;
echo   scheduled_date?: string;
echo   started_at?: string;
echo   ended_at?: string;
echo   privacy_level: 'low' ^| 'standard' ^| 'high';
echo   auto_transcription: boolean;
echo   agenda_items: AgendaItem[];
echo   participants: Participant[];
echo   transcriptions: Transcription[];
echo }
echo.
echo export interface AgendaItem {
echo   id: string;
echo   title: string;
echo   description?: string;
echo   duration_minutes?: number;
echo   order: number;
echo   status: 'pending' ^| 'active' ^| 'completed';
echo }
echo.
echo export interface Participant {
echo   id: string;
echo   name: string;
echo   email: string;
echo   role: 'organizer' ^| 'participant' ^| 'observer';
echo   joined_at?: string;
echo   left_at?: string;
echo }
echo.
echo export interface Transcription {
echo   id: string;
echo   content: string;
echo   speaker?: string;
echo   confidence?: number;
echo   timestamp: string;
echo   agenda_item_id?: string;
echo }
echo.
echo export interface AudioChunk {
echo   data: Blob;
echo   timestamp: number;
echo   duration: number;
echo }
echo.
echo // API Response types
echo export interface ApiResponse^<T^> {
echo   success: boolean;
echo   data?: T;
echo   message?: string;
echo   errors?: Record^<string, string[]^>;
echo }
echo.
echo export interface PaginatedResponse^<T^> {
echo   data: T[];
echo   total: number;
echo   per_page: number;
echo   current_page: number;
echo   last_page: number;
echo }
) > src\types\index.ts

echo ✅ TypeScript types gemaakt

echo.
echo [STAP 11] Test setup bestanden maken...

:: Jest setup
(
echo import '@testing-library/jest-dom';
echo import { configure } from '@testing-library/react';
echo.
echo configure({ testIdAttribute: 'data-testid' });
echo.
echo // Mock MediaRecorder voor audio tests
echo global.MediaRecorder = class MediaRecorder {
echo   static isTypeSupported() { return true; }
echo   constructor() {}
echo   start() {}
echo   stop() {}
echo   addEventListener() {}
echo   removeEventListener() {}
echo } as any;
echo.
echo // Mock fetch
echo global.fetch = jest.fn();
) > tests\utils\setupTests.ts

:: Test helpers
(
echo import React from 'react';
echo import { render, RenderOptions } from '@testing-library/react';
echo import { BrowserRouter } from 'react-router-dom';
echo import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
echo.
echo const createTestQueryClient = () => new QueryClient({
echo   defaultOptions: {
echo     queries: { retry: false },
echo     mutations: { retry: false },
echo   },
echo });
echo.
echo interface CustomRenderOptions extends Omit^<RenderOptions, 'wrapper'^> {
echo   queryClient?: QueryClient;
echo }
echo.
echo export const renderWithProviders = (
echo   ui: React.ReactElement,
echo   { queryClient = createTestQueryClient(), ...options }: CustomRenderOptions = {}
echo ) => {
echo   const Wrapper = ({ children }: { children: React.ReactNode }) => (
echo     ^<BrowserRouter^>
echo       ^<QueryClientProvider client={queryClient}^>
echo         {children}
echo       ^</QueryClientProvider^>
echo     ^</BrowserRouter^>
echo   );
echo.
echo   return render(ui, { wrapper: Wrapper, ...options });
echo };
echo.
echo export * from '@testing-library/react';
echo export { renderWithProviders as render };
) > tests\utils\testHelpers.tsx

echo ✅ Test setup gemaakt

echo.
echo [STAP 12] Basis React bestanden maken...

:: main.tsx
(
echo import React from 'react'
echo import ReactDOM from 'react-dom/client'
echo import App from './App.tsx'
echo import './styles/index.css'
echo.
echo ReactDOM.createRoot(document.getElementById('root')!).render(
echo   ^<React.StrictMode^>
echo     ^<App /^>
echo   ^</React.StrictMode^>,
echo )
) > src\main.tsx

:: App.tsx
(
echo import React from 'react';
echo import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
echo import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
echo import { AuthProvider } from '@/contexts/AuthContext';
echo import MainLayout from '@/layouts/MainLayout';
echo import Login from '@/pages/auth/Login';
echo import Dashboard from '@/pages/dashboard/Dashboard';
echo import './styles/App.css';
echo.
echo const queryClient = new QueryClient();
echo.
echo function App() {
echo   return (
echo     ^<QueryClientProvider client={queryClient}^>
echo       ^<AuthProvider^>
echo         ^<Router^>
echo           ^<Routes^>
echo             ^<Route path="/login" element={^<Login /^>} /^>
echo             ^<Route path="/" element={^<MainLayout /^>}^>
echo               ^<Route index element={^<Navigate to="/dashboard" /^>} /^>
echo               ^<Route path="dashboard" element={^<Dashboard /^>} /^>
echo               ^<Route path="meetings/*" element={^<div^>Meetings^</div^>} /^>
echo               ^<Route path="settings/*" element={^<div^>Settings^</div^>} /^>
echo             ^</Route^>
echo           ^</Routes^>
echo         ^</Router^>
echo       ^</AuthProvider^>
echo     ^</QueryClientProvider^>
echo   );
echo }
echo.
echo export default App;
) > src\App.tsx

:: Basic CSS
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo :root {
echo   font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
echo   line-height: 1.5;
echo   font-weight: 400;
echo   color-scheme: light dark;
echo   color: rgba(255, 255, 255, 0.87);
echo   background-color: #242424;
echo   font-synthesis: none;
echo   text-rendering: optimizeLegibility;
echo   -webkit-font-smoothing: antialiased;
echo   -moz-osx-font-smoothing: grayscale;
echo   -webkit-text-size-adjust: 100%%;
echo }
echo.
echo body {
echo   margin: 0;
echo   display: flex;
echo   place-items: center;
echo   min-width: 320px;
echo   min-height: 100vh;
echo }
echo.
echo #root {
echo   width: 100%%;
echo   margin: 0 auto;
echo }
) > src\styles\index.css

(
echo .App {
echo   text-align: center;
echo }
echo.
echo /* ConversationHub specific styles */
echo .conversation-card {
echo   @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
echo }
echo.
echo .conversation-button {
echo   @apply bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors;
echo }
) > src\styles\App.css

echo ✅ Basis React bestanden gemaakt

echo.
echo [STAP 13] Basis layout componenten maken...

:: MainLayout.tsx
(
echo import React from 'react';
echo import { Outlet } from 'react-router-dom';
echo import Header from './components/Header';
echo import Sidebar from './components/Sidebar';
echo.
echo const MainLayout: React.FC = () => {
echo   return (
echo     ^<div className="min-h-screen bg-gray-50"^>
echo       ^<Header /^>
echo       ^<div className="flex"^>
echo         ^<Sidebar /^>
echo         ^<main className="flex-1 p-6"^>
echo           ^<Outlet /^>
echo         ^</main^>
echo       ^</div^>
echo     ^</div^>
echo   );
echo };
echo.
echo export default MainLayout;
) > src\layouts\MainLayout.tsx

:: Header.tsx
(
echo import React from 'react';
echo import { useNavigate } from 'react-router-dom';
echo.
echo const Header: React.FC = () => {
echo   const navigate = useNavigate();
echo.
echo   return (
echo     ^<header className="bg-white shadow-sm border-b border-gray-200"^>
echo       ^<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"^>
echo         ^<div className="flex justify-between items-center h-16"^>
echo           ^<div className="flex items-center"^>
echo             ^<h1 className="text-xl font-semibold text-gray-900"^>
echo               ConversationHub
echo             ^</h1^>
echo           ^</div^>
echo           ^<div className="flex items-center space-x-4"^>
echo             ^<button 
echo               onClick={() => navigate('/settings')}
echo               className="text-gray-500 hover:text-gray-700"
echo             ^>
echo               Instellingen
echo             ^</button^>
echo           ^</div^>
echo         ^</div^>
echo       ^</div^>
echo     ^</header^>
echo   );
echo };
echo.
echo export default Header;
) > src\layouts\components\Header.tsx

:: Sidebar.tsx
(
echo import React from 'react';
echo import { NavLink } from 'react-router-dom';
echo.
echo const Sidebar: React.FC = () => {
echo   const navItems = [
echo     { path: '/dashboard', label: 'Dashboard', icon: '📊' },
echo     { path: '/meetings', label: 'Gesprekken', icon: '💬' },
echo     { path: '/meetings/create', label: 'Nieuw Gesprek', icon: '➕' },
echo     { path: '/settings', label: 'Instellingen', icon: '⚙️' },
echo   ];
echo.
echo   return (
echo     ^<nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen"^>
echo       ^<div className="p-4"^>
echo         ^<ul className="space-y-2"^>
echo           {navItems.map((item) => (
echo             ^<li key={item.path}^>
echo               ^<NavLink
echo                 to={item.path}
echo                 className={({ isActive }) =>
echo                   `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
echo                     isActive
echo                       ? 'bg-primary-100 text-primary-700'
echo                       : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
echo                   }`
echo                 }
echo               ^>
echo                 ^<span className="mr-3"^>{item.icon}^</span^>
echo                 {item.label}
echo               ^</NavLink^>
echo             ^</li^>
echo           ))}
echo         ^</ul^>
echo       ^</div^>
echo     ^</nav^>
echo   );
echo };
echo.
echo export default Sidebar;
) > src\layouts\components\Sidebar.tsx

echo ✅ Layout componenten gemaakt

echo.
echo [STAP 14] Basis pages maken...

:: Login.tsx
(
echo import React, { useState } from 'react';
echo import { useNavigate } from 'react-router-dom';
echo.
echo const Login: React.FC = () => {
echo   const [email, setEmail] = useState('');
echo   const [password, setPassword] = useState('');
echo   const navigate = useNavigate();
echo.
echo   const handleSubmit = (e: React.FormEvent) => {
echo     e.preventDefault();
echo     // TODO: Implement login logic
echo     navigate('/dashboard');
echo   };
echo.
echo   return (
echo     ^<div className="min-h-screen flex items-center justify-center bg-gray-50"^>
echo       ^<div className="max-w-md w-full space-y-8"^>
echo         ^<div^>
echo           ^<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900"^>
echo             Inloggen bij ConversationHub
echo           ^</h2^>
echo         ^</div^>
echo         ^<form className="mt-8 space-y-6" onSubmit={handleSubmit}^>
echo           ^<div^>
echo             ^<label htmlFor="email" className="sr-only"^>Email^</label^>
echo             ^<input
echo               id="email"
echo               type="email"
echo               value={email}
echo               onChange={(e) => setEmail(e.target.value)}
echo               required
echo               className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
echo               placeholder="Email adres"
echo             /^>
echo           ^</div^>
echo           ^<div^>
echo             ^<label htmlFor="password" className="sr-only"^>Wachtwoord^</label^>
echo             ^<input
echo               id="password"
echo               type="password"
echo               value={password}
echo               onChange={(e) => setPassword(e.target.value)}
echo               required
echo               className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
echo               placeholder="Wachtwoord"
echo             /^>
echo           ^</div^>
echo           ^<div^>
echo             ^<button
echo               type="submit"
echo               className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
echo             ^>
echo               Inloggen
echo             ^</button^>
echo           ^</div^>
echo         ^</form^>
echo       ^</div^>
echo     ^</div^>
echo   );
echo };
echo.
echo export default Login;
) > src\pages\auth\Login.tsx

:: Dashboard.tsx
(
echo import React from 'react';
echo import { useNavigate } from 'react-router-dom';
echo.
echo const Dashboard: React.FC = () => {
echo   const navigate = useNavigate();
echo.
echo   return (
echo     ^<div className="space-y-6"^>
echo       ^<div^>
echo         ^<h1 className="text-2xl font-bold text-gray-900"^>Dashboard^</h1^>
echo         ^<p className="mt-1 text-sm text-gray-600"^>
echo           Welkom bij ConversationHub - uw intelligente gespreksondersteuning
echo         ^</p^>
echo       ^</div^>
echo.
echo       ^<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"^>
echo         ^<div className="conversation-card"^>
echo           ^<h3 className="text-lg font-medium text-gray-900 mb-2"^>Nieuw Gesprek^</h3^>
echo           ^<p className="text-gray-600 mb-4"^>Start een nieuwe gespreksessie met live transcriptie^</p^>
echo           ^<button 
echo             onClick={() => navigate('/meetings/create')}
echo             className="conversation-button"
echo           ^>
echo             Gesprek Starten
echo           ^</button^>
echo         ^</div^>
echo.
echo         ^<div className="conversation-card"^>
echo           ^<h3 className="text-lg font-medium text-gray-900 mb-2"^>Recente Gesprekken^</h3^>
echo           ^<p className="text-gray-600 mb-4"^>Bekijk je laatst gevoerde gesprekken^</p^>
echo           ^<button 
echo             onClick={() => navigate('/meetings')}
echo             className="conversation-button"
echo           ^>
echo             Bekijk Gesprekken
echo           ^</button^>
echo         ^</div^>
echo.
echo         ^<div className="conversation-card"^>
echo           ^<h3 className="text-lg font-medium text-gray-900 mb-2"^>Instellingen^</h3^>
echo           ^<p className="text-gray-600 mb-4"^>Beheer je account en voorkeuren^</p^>
echo           ^<button 
echo             onClick={() => navigate('/settings')}
echo             className="conversation-button"
echo           ^>
echo             Instellingen
echo           ^</button^>
echo         ^</div^>
echo       ^</div^>
echo.
echo       ^<div className="conversation-card"^>
echo         ^<h3 className="text-lg font-medium text-gray-900 mb-4"^>Snelle Statistieken^</h3^>
echo         ^<div className="grid grid-cols-2 md:grid-cols-4 gap-4"^>
echo           ^<div className="text-center"^>
echo             ^<div className="text-2xl font-bold text-primary-600"^>0^</div^>
echo             ^<div className="text-sm text-gray-600"^>Actieve Gesprekken^</div^>
echo           ^</div^>
echo           ^<div className="text-center"^>
echo             ^<div className="text-2xl font-bold text-green-600"^>0^</div^>
echo             ^<div className="text-sm text-gray-600"^>Voltooide Gesprekken^</div^>
echo           ^</div^>
echo           ^<div className="text-center"^>
echo             ^<div className="text-2xl font-bold text-blue-600"^>0^</div^>
echo             ^<div className="text-sm text-gray-600"^>Transcripties^</div^>
echo           ^</div^>
echo           ^<div className="text-center"^>
echo             ^<div className="text-2xl font-bold text-purple-600"^>0^</div^>
echo             ^<div className="text-sm text-gray-600"^>Deelnemers^</div^>
echo           ^</div^>
echo         ^</div^>
echo       ^</div^>
echo     ^</div^>
echo   );
echo };
echo.
echo export default Dashboard;
) > src\pages\dashboard\Dashboard.tsx

echo ✅ Basis pages gemaakt

echo.
echo [STAP 15] AuthContext maken...

(
echo import React, { createContext, useContext, useState, ReactNode } from 'react';
echo.
echo interface User {
echo   id: string;
echo   name: string;
echo   email: string;
echo   role: string;
echo }
echo.
echo interface AuthContextType {
echo   user: User ^| null;
echo   isAuthenticated: boolean;
echo   loading: boolean;
echo   login: (email: string, password: string) => Promise^<void^>;
echo   logout: () => void;
echo }
echo.
echo const AuthContext = createContext^<AuthContextType ^| undefined^>(undefined);
echo.
echo export const useAuth = () => {
echo   const context = useContext(AuthContext);
echo   if (context === undefined) {
echo     throw new Error('useAuth must be used within an AuthProvider');
echo   }
echo   return context;
echo };
echo.
echo interface AuthProviderProps {
echo   children: ReactNode;
echo }
echo.
echo export const AuthProvider: React.FC^<AuthProviderProps^> = ({ children }) => {
echo   const [user, setUser] = useState^<User ^| null^>(null);
echo   const [loading, setLoading] = useState(false);
echo.
echo   const login = async (email: string, password: string) => {
echo     setLoading(true);
echo     try {
echo       // TODO: Implement actual login API call
echo       const mockUser: User = {
echo         id: '1',
echo         name: 'Test User',
echo         email,
echo         role: 'user'
echo       };
echo       setUser(mockUser);
echo     } catch (error) {
echo       console.error('Login failed:', error);
echo     } finally {
echo       setLoading(false);
echo     }
echo   };
echo.
echo   const logout = () => {
echo     setUser(null);
echo   };
echo.
echo   const value = {
echo     user,
echo     isAuthenticated: !!user,
echo     loading,
echo     login,
echo     logout,
echo   };
echo.
echo   return ^<AuthContext.Provider value={value}^>{children}^</AuthContext.Provider^>;
echo };
) > src\contexts\AuthContext.tsx

echo ✅ AuthContext gemaakt

echo.
echo [STAP 16] Basis service bestanden maken...

:: API service
(
echo import axios, { AxiosInstance, AxiosResponse } from 'axios';
echo import type { ApiResponse } from '@/types';
echo.
echo class ApiService {
echo   private api: AxiosInstance;
echo.
echo   constructor() {
echo     this.api = axios.create({
echo       baseURL: 'http://localhost:8000/api',
echo       timeout: 10000,
echo       headers: {
echo         'Content-Type': 'application/json',
echo         'Accept': 'application/json',
echo       },
echo     });
echo.
echo     this.setupInterceptors();
echo   }
echo.
echo   private setupInterceptors() {
echo     // Request interceptor
echo     this.api.interceptors.request.use(
echo       (config) => {
echo         const token = localStorage.getItem('auth_token');
echo         if (token) {
echo           config.headers.Authorization = `Bearer ${token}`;
echo         }
echo         return config;
echo       },
echo       (error) => Promise.reject(error)
echo     );
echo.
echo     // Response interceptor
echo     this.api.interceptors.response.use(
echo       (response) => response,
echo       (error) => {
echo         if (error.response?.status === 401) {
echo           localStorage.removeItem('auth_token');
echo           window.location.href = '/login';
echo         }
echo         return Promise.reject(error);
echo       }
echo     );
echo   }
echo.
echo   async get^<T^>(url: string): Promise^<ApiResponse^<T^>^> {
echo     const response: AxiosResponse^<ApiResponse^<T^>^> = await this.api.get(url);
echo     return response.data;
echo   }
echo.
echo   async post^<T^>(url: string, data?: any): Promise^<ApiResponse^<T^>^> {
echo     const response: AxiosResponse^<ApiResponse^<T^>^> = await this.api.post(url, data);
echo     return response.data;
echo   }
echo.
echo   async put^<T^>(url: string, data?: any): Promise^<ApiResponse^<T^>^> {
echo     const response: AxiosResponse^<ApiResponse^<T^>^> = await this.api.put(url, data);
echo     return response.data;
echo   }
echo.
echo   async delete^<T^>(url: string): Promise^<ApiResponse^<T^>^> {
echo     const response: AxiosResponse^<ApiResponse^<T^>^> = await this.api.delete(url);
echo     return response.data;
echo   }
echo }
echo.
echo export default new ApiService();
) > src\services\api\apiService.ts

:: Meeting service
(
echo import apiService from './apiService';
echo import type { Meeting, ApiResponse, PaginatedResponse } from '@/types';
echo.
echo export const meetingService = {
echo   async getMeetings(): Promise^<PaginatedResponse^<Meeting^>^> {
echo     const response = await apiService.get^<PaginatedResponse^<Meeting^>^>('/meetings');
echo     return response.data!;
echo   },
echo.
echo   async getMeeting(id: string): Promise^<Meeting^> {
echo     const response = await apiService.get^<Meeting^>(`/meetings/${id}`);
echo     return response.data!;
echo   },
echo.
echo   async createMeeting(meeting: Partial^<Meeting^>): Promise^<Meeting^> {
echo     const response = await apiService.post^<Meeting^>('/meetings', meeting);
echo     return response.data!;
echo   },
echo.
echo   async updateMeeting(id: string, meeting: Partial^<Meeting^>): Promise^<Meeting^> {
echo     const response = await apiService.put^<Meeting^>(`/meetings/${id}`, meeting);
echo     return response.data!;
echo   },
echo.
echo   async deleteMeeting(id: string): Promise^<void^> {
echo     await apiService.delete(`/meetings/${id}`);
echo   },
echo };
) > src\services\api\meetingService.ts

echo ✅ Service bestanden gemaakt

echo.
echo [STAP 17] Sample E2E test maken...

(
echo import { test, expect } from '@playwright/test';
echo.
echo test.describe('ConversationHub E2E Tests', () => {
echo   test.beforeEach(async ({ page }) => {
echo     await page.goto('/');
echo   });
echo.
echo   test('should redirect to login when not authenticated', async ({ page }) => {
echo     await expect(page).toHaveURL('/login');
echo     await expect(page.locator('h2')).toContainText('Inloggen bij ConversationHub');
echo   });
echo.
echo   test('should login and navigate to dashboard', async ({ page }) => {
echo     await page.goto('/login');
echo     
echo     await page.fill('[placeholder="Email adres"]', 'test@example.com');
echo     await page.fill('[placeholder="Wachtwoord"]', 'password');
echo     await page.click('button[type="submit"]');
echo.
echo     await expect(page).toHaveURL('/dashboard');
echo     await expect(page.locator('h1')).toContainText('Dashboard');
echo   });
echo.
echo   test('should navigate between pages using sidebar', async ({ page }) => {
echo     // Login first
echo     await page.goto('/login');
echo     await page.fill('[placeholder="Email adres"]', 'test@example.com');
echo     await page.fill('[placeholder="Wachtwoord"]', 'password');
echo     await page.click('button[type="submit"]');
echo.
echo     // Test navigation
echo     await page.click('text=Gesprekken');
echo     await expect(page).toHaveURL('/meetings');
echo.
echo     await page.click('text=Instellingen');
echo     await expect(page).toHaveURL('/settings');
echo.
echo     await page.click('text=Dashboard');
echo     await expect(page).toHaveURL('/dashboard');
echo   });
echo });
) > tests\e2e\basic-navigation.spec.ts

echo ✅ E2E test gemaakt

echo.
echo [STAP 18] Sample unit test maken...

(
echo import React from 'react';
echo import { render, screen } from '@testing-library/react';
echo import { renderWithProviders } from '../utils/testHelpers';
echo import Dashboard from '@/pages/dashboard/Dashboard';
echo.
echo describe('Dashboard', () => {
echo   it('should render dashboard title', () => {
echo     renderWithProviders(^<Dashboard /^>);
echo     
echo     expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
echo     expect(screen.getByText(/welkom bij conversationhub/i)).toBeInTheDocument();
echo   });
echo.
echo   it('should render action cards', () => {
echo     renderWithProviders(^<Dashboard /^>);
echo     
echo     expect(screen.getByText('Nieuw Gesprek')).toBeInTheDocument();
echo     expect(screen.getByText('Recente Gesprekken')).toBeInTheDocument();
echo     expect(screen.getByText('Instellingen')).toBeInTheDocument();
echo   });
echo.
echo   it('should render statistics section', () => {
echo     renderWithProviders(^<Dashboard /^>);
echo     
echo     expect(screen.getByText('Snelle Statistieken')).toBeInTheDocument();
echo     expect(screen.getByText('Actieve Gesprekken')).toBeInTheDocument();
echo     expect(screen.getByText('Voltooide Gesprekken')).toBeInTheDocument();
echo   });
echo });
) > tests\unit\Dashboard.test.tsx

echo ✅ Unit test gemaakt

echo.
echo [STAP 19] Dependencies installeren...
echo 📦 Installeren van alle dependencies...
call npm install

echo.
echo 📦 Installeren van Playwright browsers...
call npx playwright install

echo ✅ Dependencies geïnstalleerd

echo.
echo [STAP 20] Belangrijke bestanden uit backup kopiëren...

:: Kopieer belangrijke bestanden uit de oude structuur als ze bestaan
if exist "%CURRENT_BACKUP%\src\types\index.ts" (
    echo 📋 TypeScript types uit backup kopiëren...
    copy "%CURRENT_BACKUP%\src\types\index.ts" "src\types\enhanced-types.ts" >nul
    echo ✅ Enhanced types bewaard
)

if exist "%CURRENT_BACKUP%\src\components\recording\clean" (
    echo 📋 Audio recording componenten kopiëren...
    xcopy "%CURRENT_BACKUP%\src\components\recording\clean" "src\components\recording\clean" /E /I /Q >nul
    echo ✅ Recording componenten bewaard
)

if exist "%CURRENT_BACKUP%\src\services\api" (
    echo 📋 API services uit backup kopiëren...
    xcopy "%CURRENT_BACKUP%\src\services\api" "src\services\api\legacy" /E /I /Q >nul
    echo ✅ Legacy API services bewaard
)

echo.
echo ============================================
echo ✅ COMPLETE FRONTEND RESTRUCTURE VOLTOOID!
echo ============================================
echo.
echo 📁 Nieuwe directory structuur:
echo    src/
echo    ├── components/          # UI componenten (organized by feature)
echo    ├── pages/              # Route componenten  
echo    ├── layouts/            # Layout componenten (Header, Sidebar renamed)
echo    ├── hooks/              # Custom React hooks
echo    ├── contexts/           # React contexts
echo    ├── services/           # API services + business logic
echo    ├── types/              # TypeScript definities
echo    ├── utils/              # Helper functions
echo    └── styles/             # CSS bestanden
echo.
echo    tests/
echo    ├── unit/               # Jest unit tests
echo    ├── integration/        # Integration tests
echo    ├── e2e/               # Playwright E2E tests
echo    ├── fixtures/          # Test data
echo    └── utils/             # Test helpers
echo.
echo 🧪 Testing setup:
echo    ✅ Jest unit tests      - npm test
echo    ✅ Playwright E2E tests - npm run e2e
echo    ✅ Test coverage       - npm run test:coverage
echo    ✅ TypeScript check    - npm run type-check
echo.
echo 🚀 Development commands:
echo    npm run dev            - Start development server
echo    npm run build          - Build for production
echo    npm run test           - Run unit tests
echo    npm run e2e            - Run E2E tests
echo    npm run test:all       - Run all tests
echo.
echo 📦 Backups bewaard in:
echo    ✅ %CURRENT_BACKUP%    - Complete huidige setup
echo    ✅ backup-temp         - Eerdere backup
echo    ✅ backup-temp-old     - Oudste backup
echo.
echo 💡 Volgende stappen:
echo    1. npm run dev         - Test de nieuwe setup
echo    2. npm run test        - Controleer unit tests
echo    3. npm run e2e         - Test E2E flows
echo    4. Migreer je oude componenten naar nieuwe structuur
echo.
echo 🎯 Layout hernoem voltooid:
echo    ❌ MaterialProLayout   → ✅ MainLayout
echo    ❌ MaterialProHeader   → ✅ Header  
echo    ❌ MaterialProSidebar  → ✅ Sidebar
echo.
pause