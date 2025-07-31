@echo off
echo ============================================
echo ConversationHub - Build Component Structure
echo Creating all pages and components
echo ============================================
echo.

cd /d "C:\conversationhub\frontend"

echo [STAP 1] AuthContext maken...

:: AuthContext.tsx
echo import React, { createContext, useContext, useState, ReactNode } from 'react'; > src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo interface User { >> src\contexts\AuthContext.tsx
echo   id: string; >> src\contexts\AuthContext.tsx
echo   name: string; >> src\contexts\AuthContext.tsx
echo   email: string; >> src\contexts\AuthContext.tsx
echo } >> src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo interface AuthContextType { >> src\contexts\AuthContext.tsx
echo   user: User ^| null; >> src\contexts\AuthContext.tsx
echo   isAuthenticated: boolean; >> src\contexts\AuthContext.tsx
echo   loading: boolean; >> src\contexts\AuthContext.tsx
echo   login: (email: string, password: string) =^> Promise^<void^>; >> src\contexts\AuthContext.tsx
echo   logout: () =^> void; >> src\contexts\AuthContext.tsx
echo } >> src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo const AuthContext = createContext^<AuthContextType ^| undefined^>(undefined); >> src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo export const useAuth = () =^> { >> src\contexts\AuthContext.tsx
echo   const context = useContext(AuthContext); >> src\contexts\AuthContext.tsx
echo   if (!context) throw new Error('useAuth must be used within AuthProvider'); >> src\contexts\AuthContext.tsx
echo   return context; >> src\contexts\AuthContext.tsx
echo }; >> src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo export const AuthProvider: React.FC^<{ children: ReactNode }^> = ({ children }) =^> { >> src\contexts\AuthContext.tsx
echo   const [user, setUser] = useState^<User ^| null^>(null); >> src\contexts\AuthContext.tsx
echo   const [loading, setLoading] = useState(false); >> src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo   const login = async (email: string, password: string) =^> { >> src\contexts\AuthContext.tsx
echo     setLoading(true); >> src\contexts\AuthContext.tsx
echo     // TODO: Implement API call >> src\contexts\AuthContext.tsx
echo     setUser({ id: '1', name: 'Test User', email }); >> src\contexts\AuthContext.tsx
echo     setLoading(false); >> src\contexts\AuthContext.tsx
echo   }; >> src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo   const logout = () =^> setUser(null); >> src\contexts\AuthContext.tsx
echo. >> src\contexts\AuthContext.tsx
echo   return ( >> src\contexts\AuthContext.tsx
echo     ^<AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}^> >> src\contexts\AuthContext.tsx
echo       {children} >> src\contexts\AuthContext.tsx
echo     ^</AuthContext.Provider^> >> src\contexts\AuthContext.tsx
echo   ); >> src\contexts\AuthContext.tsx
echo }; >> src\contexts\AuthContext.tsx

echo ✅ AuthContext created

echo.
echo [STAP 2] Layout componenten maken...

:: MainLayout.tsx
echo import React from 'react'; > src\layouts\MainLayout.tsx
echo import { Outlet } from 'react-router-dom'; >> src\layouts\MainLayout.tsx
echo import Header from './components/Header'; >> src\layouts\MainLayout.tsx
echo import Sidebar from './components/Sidebar'; >> src\layouts\MainLayout.tsx
echo import { useAuth } from '@/contexts/AuthContext'; >> src\layouts\MainLayout.tsx
echo. >> src\layouts\MainLayout.tsx
echo const MainLayout: React.FC = () =^> { >> src\layouts\MainLayout.tsx
echo   const { isAuthenticated } = useAuth(); >> src\layouts\MainLayout.tsx
echo. >> src\layouts\MainLayout.tsx
echo   if (!isAuthenticated) { >> src\layouts\MainLayout.tsx
echo     return ^<div^>Please log in^</div^>; >> src\layouts\MainLayout.tsx
echo   } >> src\layouts\MainLayout.tsx
echo. >> src\layouts\MainLayout.tsx
echo   return ( >> src\layouts\MainLayout.tsx
echo     ^<div className="min-h-screen bg-gray-50"^> >> src\layouts\MainLayout.tsx
echo       ^<Header /^> >> src\layouts\MainLayout.tsx
echo       ^<div className="flex"^> >> src\layouts\MainLayout.tsx
echo         ^<Sidebar /^> >> src\layouts\MainLayout.tsx
echo         ^<main className="flex-1 p-6"^> >> src\layouts\MainLayout.tsx
echo           ^<Outlet /^> >> src\layouts\MainLayout.tsx
echo         ^</main^> >> src\layouts\MainLayout.tsx
echo       ^</div^> >> src\layouts\MainLayout.tsx
echo     ^</div^> >> src\layouts\MainLayout.tsx
echo   ); >> src\layouts\MainLayout.tsx
echo }; >> src\layouts\MainLayout.tsx
echo. >> src\layouts\MainLayout.tsx
echo export default MainLayout; >> src\layouts\MainLayout.tsx

:: Header.tsx
echo import React from 'react'; > src\layouts\components\Header.tsx
echo import { useAuth } from '@/contexts/AuthContext'; >> src\layouts\components\Header.tsx
echo. >> src\layouts\components\Header.tsx
echo const Header: React.FC = () =^> { >> src\layouts\components\Header.tsx
echo   const { user, logout } = useAuth(); >> src\layouts\components\Header.tsx
echo. >> src\layouts\components\Header.tsx
echo   return ( >> src\layouts\components\Header.tsx
echo     ^<header className="bg-white shadow-sm border-b border-gray-200"^> >> src\layouts\components\Header.tsx
echo       ^<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"^> >> src\layouts\components\Header.tsx
echo         ^<div className="flex justify-between items-center h-16"^> >> src\layouts\components\Header.tsx
echo           ^<h1 className="text-xl font-semibold text-gray-900"^>ConversationHub^</h1^> >> src\layouts\components\Header.tsx
echo           ^<div className="flex items-center space-x-4"^> >> src\layouts\components\Header.tsx
echo             ^<span^>Welkom, {user?.name}^</span^> >> src\layouts\components\Header.tsx
echo             ^<button onClick={logout} className="text-red-600 hover:text-red-800"^> >> src\layouts\components\Header.tsx
echo               Uitloggen >> src\layouts\components\Header.tsx
echo             ^</button^> >> src\layouts\components\Header.tsx
echo           ^</div^> >> src\layouts\components\Header.tsx
echo         ^</div^> >> src\layouts\components\Header.tsx
echo       ^</div^> >> src\layouts\components\Header.tsx
echo     ^</header^> >> src\layouts\components\Header.tsx
echo   ); >> src\layouts\components\Header.tsx
echo }; >> src\layouts\components\Header.tsx
echo. >> src\layouts\components\Header.tsx
echo export default Header; >> src\layouts\components\Header.tsx

:: Sidebar.tsx
echo import React from 'react'; > src\layouts\components\Sidebar.tsx
echo import { NavLink } from 'react-router-dom'; >> src\layouts\components\Sidebar.tsx
echo. >> src\layouts\components\Sidebar.tsx
echo const Sidebar: React.FC = () =^> { >> src\layouts\components\Sidebar.tsx
echo   const navItems = [ >> src\layouts\components\Sidebar.tsx
echo     { path: '/dashboard', label: 'Dashboard', icon: '📊' }, >> src\layouts\components\Sidebar.tsx
echo     { path: '/meetings', label: 'Gesprekken', icon: '💬' }, >> src\layouts\components\Sidebar.tsx
echo     { path: '/meetings/create', label: 'Nieuw Gesprek', icon: '➕' }, >> src\layouts\components\Sidebar.tsx
echo     { path: '/settings', label: 'Instellingen', icon: '⚙️' }, >> src\layouts\components\Sidebar.tsx
echo   ]; >> src\layouts\components\Sidebar.tsx
echo. >> src\layouts\components\Sidebar.tsx
echo   return ( >> src\layouts\components\Sidebar.tsx
echo     ^<nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen"^> >> src\layouts\components\Sidebar.tsx
echo       ^<div className="p-4"^> >> src\layouts\components\Sidebar.tsx
echo         ^<ul className="space-y-2"^> >> src\layouts\components\Sidebar.tsx
echo           {navItems.map((item) =^> ( >> src\layouts\components\Sidebar.tsx
echo             ^<li key={item.path}^> >> src\layouts\components\Sidebar.tsx
echo               ^<NavLink >> src\layouts\components\Sidebar.tsx
echo                 to={item.path} >> src\layouts\components\Sidebar.tsx
echo                 className={({ isActive }) =^> >> src\layouts\components\Sidebar.tsx
echo                   `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${ >> src\layouts\components\Sidebar.tsx
echo                     isActive >> src\layouts\components\Sidebar.tsx
echo                       ? 'bg-blue-100 text-blue-700' >> src\layouts\components\Sidebar.tsx
echo                       : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' >> src\layouts\components\Sidebar.tsx
echo                   }` >> src\layouts\components\Sidebar.tsx
echo                 } >> src\layouts\components\Sidebar.tsx
echo               ^> >> src\layouts\components\Sidebar.tsx
echo                 ^<span className="mr-3"^>{item.icon}^</span^> >> src\layouts\components\Sidebar.tsx
echo                 {item.label} >> src\layouts\components\Sidebar.tsx
echo               ^</NavLink^> >> src\layouts\components\Sidebar.tsx
echo             ^</li^> >> src\layouts\components\Sidebar.tsx
echo           ))} >> src\layouts\components\Sidebar.tsx
echo         ^</ul^> >> src\layouts\components\Sidebar.tsx
echo       ^</div^> >> src\layouts\components\Sidebar.tsx
echo     ^</nav^> >> src\layouts\components\Sidebar.tsx
echo   ); >> src\layouts\components\Sidebar.tsx
echo }; >> src\layouts\components\Sidebar.tsx
echo. >> src\layouts\components\Sidebar.tsx
echo export default Sidebar; >> src\layouts\components\Sidebar.tsx

echo ✅ Layout components created

echo.
echo [STAP 3] Pages maken...

:: Login.tsx
echo import React, { useState } from 'react'; > src\pages\auth\Login.tsx
echo import { useNavigate } from 'react-router-dom'; >> src\pages\auth\Login.tsx
echo import { useAuth } from '@/contexts/AuthContext'; >> src\pages\auth\Login.tsx
echo. >> src\pages\auth\Login.tsx
echo const Login: React.FC = () =^> { >> src\pages\auth\Login.tsx
echo   const [email, setEmail] = useState(''); >> src\pages\auth\Login.tsx
echo   const [password, setPassword] = useState(''); >> src\pages\auth\Login.tsx
echo   const { login } = useAuth(); >> src\pages\auth\Login.tsx
echo   const navigate = useNavigate(); >> src\pages\auth\Login.tsx
echo. >> src\pages\auth\Login.tsx
echo   const handleSubmit = async (e: React.FormEvent) =^> { >> src\pages\auth\Login.tsx
echo     e.preventDefault(); >> src\pages\auth\Login.tsx
echo     await login(email, password); >> src\pages\auth\Login.tsx
echo     navigate('/dashboard'); >> src\pages\auth\Login.tsx
echo   }; >> src\pages\auth\Login.tsx
echo. >> src\pages\auth\Login.tsx
echo   return ( >> src\pages\auth\Login.tsx
echo     ^<div className="min-h-screen flex items-center justify-center bg-gray-50"^> >> src\pages\auth\Login.tsx
echo       ^<div className="max-w-md w-full space-y-8"^> >> src\pages\auth\Login.tsx
echo         ^<h2 className="text-center text-3xl font-extrabold text-gray-900"^> >> src\pages\auth\Login.tsx
echo           Inloggen bij ConversationHub >> src\pages\auth\Login.tsx
echo         ^</h2^> >> src\pages\auth\Login.tsx
echo         ^<form onSubmit={handleSubmit} className="mt-8 space-y-6"^> >> src\pages\auth\Login.tsx
echo           ^<input >> src\pages\auth\Login.tsx
echo             type="email" >> src\pages\auth\Login.tsx
echo             value={email} >> src\pages\auth\Login.tsx
echo             onChange={(e) =^> setEmail(e.target.value)} >> src\pages\auth\Login.tsx
echo             placeholder="Email" >> src\pages\auth\Login.tsx
echo             className="w-full px-3 py-2 border border-gray-300 rounded-md" >> src\pages\auth\Login.tsx
echo             required >> src\pages\auth\Login.tsx
echo           /^> >> src\pages\auth\Login.tsx
echo           ^<input >> src\pages\auth\Login.tsx
echo             type="password" >> src\pages\auth\Login.tsx
echo             value={password} >> src\pages\auth\Login.tsx
echo             onChange={(e) =^> setPassword(e.target.value)} >> src\pages\auth\Login.tsx
echo             placeholder="Wachtwoord" >> src\pages\auth\Login.tsx
echo             className="w-full px-3 py-2 border border-gray-300 rounded-md" >> src\pages\auth\Login.tsx
echo             required >> src\pages\auth\Login.tsx
echo           /^> >> src\pages\auth\Login.tsx
echo           ^<button >> src\pages\auth\Login.tsx
echo             type="submit" >> src\pages\auth\Login.tsx
echo             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700" >> src\pages\auth\Login.tsx
echo           ^> >> src\pages\auth\Login.tsx
echo             Inloggen >> src\pages\auth\Login.tsx
echo           ^</button^> >> src\pages\auth\Login.tsx
echo         ^</form^> >> src\pages\auth\Login.tsx
echo       ^</div^> >> src\pages\auth\Login.tsx
echo     ^</div^> >> src\pages\auth\Login.tsx
echo   ); >> src\pages\auth\Login.tsx
echo }; >> src\pages\auth\Login.tsx
echo. >> src\pages\auth\Login.tsx
echo export default Login; >> src\pages\auth\Login.tsx

:: Dashboard.tsx
echo import React from 'react'; > src\pages\dashboard\Dashboard.tsx
echo import { useNavigate } from 'react-router-dom'; >> src\pages\dashboard\Dashboard.tsx
echo. >> src\pages\dashboard\Dashboard.tsx
echo const Dashboard: React.FC = () =^> { >> src\pages\dashboard\Dashboard.tsx
echo   const navigate = useNavigate(); >> src\pages\dashboard\Dashboard.tsx
echo. >> src\pages\dashboard\Dashboard.tsx
echo   return ( >> src\pages\dashboard\Dashboard.tsx
echo     ^<div className="space-y-6"^> >> src\pages\dashboard\Dashboard.tsx
echo       ^<h1 className="text-2xl font-bold text-gray-900"^>Dashboard^</h1^> >> src\pages\dashboard\Dashboard.tsx
echo       ^<div className="grid grid-cols-1 md:grid-cols-3 gap-6"^> >> src\pages\dashboard\Dashboard.tsx
echo         ^<div className="bg-white p-6 rounded-lg shadow-sm border"^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<h3 className="text-lg font-medium mb-2"^>Nieuw Gesprek^</h3^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<p className="text-gray-600 mb-4"^>Start een nieuwe gespreksessie^</p^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<button >> src\pages\dashboard\Dashboard.tsx
echo             onClick={() =^> navigate('/meetings/create')} >> src\pages\dashboard\Dashboard.tsx
echo             className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" >> src\pages\dashboard\Dashboard.tsx
echo           ^> >> src\pages\dashboard\Dashboard.tsx
echo             Gesprek Starten >> src\pages\dashboard\Dashboard.tsx
echo           ^</button^> >> src\pages\dashboard\Dashboard.tsx
echo         ^</div^> >> src\pages\dashboard\Dashboard.tsx
echo         ^<div className="bg-white p-6 rounded-lg shadow-sm border"^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<h3 className="text-lg font-medium mb-2"^>Recente Gesprekken^</h3^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<p className="text-gray-600 mb-4"^>Bekijk je laatst gevoerde gesprekken^</p^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<button >> src\pages\dashboard\Dashboard.tsx
echo             onClick={() =^> navigate('/meetings')} >> src\pages\dashboard\Dashboard.tsx
echo             className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700" >> src\pages\dashboard\Dashboard.tsx
echo           ^> >> src\pages\dashboard\Dashboard.tsx
echo             Bekijk Gesprekken >> src\pages\dashboard\Dashboard.tsx
echo           ^</button^> >> src\pages\dashboard\Dashboard.tsx
echo         ^</div^> >> src\pages\dashboard\Dashboard.tsx
echo         ^<div className="bg-white p-6 rounded-lg shadow-sm border"^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<h3 className="text-lg font-medium mb-2"^>Instellingen^</h3^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<p className="text-gray-600 mb-4"^>Beheer je voorkeuren^</p^> >> src\pages\dashboard\Dashboard.tsx
echo           ^<button >> src\pages\dashboard\Dashboard.tsx
echo             onClick={() =^> navigate('/settings')} >> src\pages\dashboard\Dashboard.tsx
echo             className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700" >> src\pages\dashboard\Dashboard.tsx
echo           ^> >> src\pages\dashboard\Dashboard.tsx
echo             Instellingen >> src\pages\dashboard\Dashboard.tsx
echo           ^</button^> >> src\pages\dashboard\Dashboard.tsx
echo         ^</div^> >> src\pages\dashboard\Dashboard.tsx
echo       ^</div^> >> src\pages\dashboard\Dashboard.tsx
echo     ^</div^> >> src\pages\dashboard\Dashboard.tsx
echo   ); >> src\pages\dashboard\Dashboard.tsx
echo }; >> src\pages\dashboard\Dashboard.tsx
echo. >> src\pages\dashboard\Dashboard.tsx
echo export default Dashboard; >> src\pages\dashboard\Dashboard.tsx

:: Meetings pages
echo import React from 'react'; > src\pages\meetings\MeetingsList.tsx
echo. >> src\pages\meetings\MeetingsList.tsx
echo const MeetingsList: React.FC = () =^> { >> src\pages\meetings\MeetingsList.tsx
echo   return ( >> src\pages\meetings\MeetingsList.tsx
echo     ^<div^> >> src\pages\meetings\MeetingsList.tsx
echo       ^<h1 className="text-2xl font-bold mb-4"^>Gesprekken^</h1^> >> src\pages\meetings\MeetingsList.tsx
echo       ^<p^>Hier komen je gesprekken te staan^</p^> >> src\pages\meetings\MeetingsList.tsx
echo     ^</div^> >> src\pages\meetings\MeetingsList.tsx
echo   ); >> src\pages\meetings\MeetingsList.tsx
echo }; >> src\pages\meetings\MeetingsList.tsx
echo. >> src\pages\meetings\MeetingsList.tsx
echo export default MeetingsList; >> src\pages\meetings\MeetingsList.tsx

echo import React from 'react'; > src\pages\meetings\CreateMeeting.tsx
echo. >> src\pages\meetings\CreateMeeting.tsx
echo const CreateMeeting: React.FC = () =^> { >> src\pages\meetings\CreateMeeting.tsx
echo   return ( >> src\pages\meetings\CreateMeeting.tsx
echo     ^<div^> >> src\pages\meetings\CreateMeeting.tsx
echo       ^<h1 className="text-2xl font-bold mb-4"^>Nieuw Gesprek^</h1^> >> src\pages\meetings\CreateMeeting.tsx
echo       ^<p^>Hier komt het formulier voor een nieuw gesprek^</p^> >> src\pages\meetings\CreateMeeting.tsx
echo     ^</div^> >> src\pages\meetings\CreateMeeting.tsx
echo   ); >> src\pages\meetings\CreateMeeting.tsx
echo }; >> src\pages\meetings\CreateMeeting.tsx
echo. >> src\pages\meetings\CreateMeeting.tsx
echo export default CreateMeeting; >> src\pages\meetings\CreateMeeting.tsx

echo import React from 'react'; > src\pages\settings\Settings.tsx
echo. >> src\pages\settings\Settings.tsx
echo const Settings: React.FC = () =^> { >> src\pages\settings\Settings.tsx
echo   return ( >> src\pages\settings\Settings.tsx
echo     ^<div^> >> src\pages\settings\Settings.tsx
echo       ^<h1 className="text-2xl font-bold mb-4"^>Instellingen^</h1^> >> src\pages\settings\Settings.tsx
echo       ^<p^>Hier komen je instellingen^</p^> >> src\pages\settings\Settings.tsx
echo     ^</div^> >> src\pages\settings\Settings.tsx
echo   ); >> src\pages\settings\Settings.tsx
echo }; >> src\pages\settings\Settings.tsx
echo. >> src\pages\settings\Settings.tsx
echo export default Settings; >> src\pages\settings\Settings.tsx

echo ✅ Pages created

echo.
echo [STAP 4] App.tsx updaten met routing...

echo import React from 'react'; > src\App.tsx
echo import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; >> src\App.tsx
echo import { AuthProvider, useAuth } from '@/contexts/AuthContext'; >> src\App.tsx
echo import MainLayout from '@/layouts/MainLayout'; >> src\App.tsx
echo import Login from '@/pages/auth/Login'; >> src\App.tsx
echo import Dashboard from '@/pages/dashboard/Dashboard'; >> src\App.tsx
echo import MeetingsList from '@/pages/meetings/MeetingsList'; >> src\App.tsx
echo import CreateMeeting from '@/pages/meetings/CreateMeeting'; >> src\App.tsx
echo import Settings from '@/pages/settings/Settings'; >> src\App.tsx
echo import './styles/App.css'; >> src\App.tsx
echo. >> src\App.tsx
echo const ProtectedRoute: React.FC^<{ children: React.ReactNode }^> = ({ children }) =^> { >> src\App.tsx
echo   const { isAuthenticated } = useAuth(); >> src\App.tsx
echo   return isAuthenticated ? ^<^>{children}^</^> : ^<Navigate to="/login" /^>; >> src\App.tsx
echo }; >> src\App.tsx
echo. >> src\App.tsx
echo function App() { >> src\App.tsx
echo   return ( >> src\App.tsx
echo     ^<AuthProvider^> >> src\App.tsx
echo       ^<Router^> >> src\App.tsx
echo         ^<Routes^> >> src\App.tsx
echo           ^<Route path="/login" element={^<Login /^>} /^> >> src\App.tsx
echo           ^<Route path="/" element={ >> src\App.tsx
echo             ^<ProtectedRoute^> >> src\App.tsx
echo               ^<MainLayout /^> >> src\App.tsx
echo             ^</ProtectedRoute^> >> src\App.tsx
echo           }^> >> src\App.tsx
echo             ^<Route index element={^<Navigate to="/dashboard" /^>} /^> >> src\App.tsx
echo             ^<Route path="dashboard" element={^<Dashboard /^>} /^> >> src\App.tsx
echo             ^<Route path="meetings" element={^<MeetingsList /^>} /^> >> src\App.tsx
echo             ^<Route path="meetings/create" element={^<CreateMeeting /^>} /^> >> src\App.tsx
echo             ^<Route path="settings" element={^<Settings /^>} /^> >> src\App.tsx
echo           ^</Route^> >> src\App.tsx
echo         ^</Routes^> >> src\App.tsx
echo       ^</Router^> >> src\App.tsx
echo     ^</AuthProvider^> >> src\App.tsx
echo   ); >> src\App.tsx
echo } >> src\App.tsx
echo. >> src\App.tsx
echo export default App; >> src\App.tsx

echo ✅ App.tsx updated with full routing

echo.
echo ============================================
echo ✅ COMPLETE COMPONENT STRUCTURE CREATED!
echo ============================================
echo.
echo 🎯 Wat er nu werkt:
echo    ✅ Login/logout systeem
echo    ✅ Protected routes
echo    ✅ Dashboard met navigatie
echo    ✅ Sidebar navigatie
echo    ✅ Header met user info
echo    ✅ Basis pages voor alle features
echo.
echo 🚀 Test je nieuwe app:
echo    npm run dev
echo.
echo 📝 Login met:
echo    Email: anything@example.com
echo    Password: anything
echo.
echo 🗂️ Page structure:
echo    /login           - Login pagina
echo    /dashboard       - Dashboard (na login)
echo    /meetings        - Gesprekken overzicht
echo    /meetings/create - Nieuw gesprek maken
echo    /settings        - Instellingen
echo.
echo 💡 Volgende stappen:
echo    1. Test de volledige navigatie
echo    2. Voeg je audio recording componenten toe
echo    3. Implementeer meeting room met panelen
echo    4. Voeg je TypeScript types uit backup toe
echo.
pause