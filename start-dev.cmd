@echo off
title ConversationHub Development Setup

echo.
echo ================================================
echo    ConversationHub Development Environment
echo ================================================
echo.

echo 🐳 Starting Docker services (database, redis, n8n)...
docker-compose start database redis n8n

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak > nul

echo.
echo 🔍 Checking Docker services...
docker-compose ps database redis n8n

echo.
echo 🚀 Starting Laravel backend (lokaal)...
start "ConversationHub Backend" cmd /k "cd /d C:\conversationhub\backend && C:\php\php.exe artisan serve --host=127.0.0.1 --port=8000"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 🎨 Starting React frontend (lokaal)...
start "ConversationHub Frontend" cmd /k "cd /d C:\conversationhub\frontend && npm run dev"

echo.
echo ================================================
echo    Development Environment Started!
echo ================================================
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8000  
echo 🗄️  Database: localhost:5432
echo 🔄 N8N:      http://localhost:5678
echo.
echo ✅ Check the opened windows for status
echo 💡 Use stop-dev.cmd to stop everything
echo.
pause