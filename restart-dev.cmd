@echo off
title ConversationHub Development Restart

echo.
echo 🔄 Restarting ConversationHub Development...
echo.

call stop-dev.cmd
timeout /t 5 /nobreak > nul
call start-dev.cmd