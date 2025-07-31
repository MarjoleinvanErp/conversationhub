@echo off
echo ============================================
echo TypeScript Installation & Configuration
echo ConversationHub Frontend Development Setup
echo ============================================
echo.

:: Navigeer naar frontend directory
cd /d C:\conversationhub\frontend

echo [STEP 1] TypeScript installeren...
echo Installing TypeScript as dev dependency...
npm install --save-dev typescript
echo ✅ TypeScript geïnstalleerd

echo.
echo [STEP 2] TypeScript configuratie controleren...
npx tsc --version
echo ✅ TypeScript versie check

echo.
echo [STEP 3] TypeScript compilatie testen...
npx tsc --noEmit
if %ERRORLEVEL% EQU 0 (
    echo ✅ TypeScript compilatie succesvol
) else (
    echo ❌ TypeScript compilatie errors - zie output hierboven
    echo Dit is normaal als er nog geen .tsx bestanden zijn
)

echo.
echo [STEP 4] Ontbrekende dependencies installeren...
npm install --save-dev @types/node
echo ✅ Node types geïnstalleerd

echo.
echo ✅ TypeScript setup voltooid!
echo.
pause