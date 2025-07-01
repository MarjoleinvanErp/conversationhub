@echo off
title ConversationHub Development Stop

echo.
echo ================================================
echo    Stopping ConversationHub Development
echo ================================================
echo.

echo 🛑 Stopping Laravel backend...
taskkill /f /im php.exe 2>nul
echo   ✅ PHP processes stopped

echo.
echo 🛑 Stopping React frontend...
taskkill /f /im node.exe 2>nul
echo   ✅ Node processes stopped

echo.
echo 🐳 Stopping Docker services...
docker-compose stop

echo.
echo ✅ All development services stopped!
echo.
pause