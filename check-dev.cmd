@echo off
title ConversationHub Development Status

echo.
echo ================================================
echo    ConversationHub Development Status
echo ================================================
echo.

echo 🐳 Docker Services:
docker-compose ps

echo.
echo 🔧 Local Processes:
echo   PHP Backend (should be running):
tasklist /fi "imagename eq php.exe" 2>nul | findstr php.exe

echo   Node Frontend (should be running):
tasklist /fi "imagename eq node.exe" 2>nul | findstr node.exe

echo.
echo 🌐 Service Check:
echo   Testing backend...
curl -s http://localhost:8000 >nul && echo   ✅ Backend: OK || echo   ❌ Backend: Not responding

echo   Testing frontend...
curl -s http://localhost:3000 >nul && echo   ✅ Frontend: OK || echo   ❌ Frontend: Not responding

echo.
pause