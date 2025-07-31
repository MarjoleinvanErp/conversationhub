@echo off
echo ============================================
echo Restore TypeScript & Testing Setup
echo ConversationHub - Quick Testing Recovery
echo ============================================
echo.

:: Stel directories in
set PROJECT_ROOT=C:\conversationhub\frontend
set BACKUP_DIR=%PROJECT_ROOT%\backup-temp

:: Navigeer naar project root
cd /d "%PROJECT_ROOT%"

if not exist "%BACKUP_DIR%" (
    echo ❌ FOUT: Backup directory niet gevonden: %BACKUP_DIR%
    echo Voer eerst het cleanup script uit
    pause
    exit /b 1
)

echo [STAP 1] TypeScript configuratie terugzetten...
if exist "%BACKUP_DIR%\tsconfig.json" (
    copy "%BACKUP_DIR%\tsconfig.json" . >nul
    echo ✅ tsconfig.json hersteld
) else (
    echo ❌ tsconfig.json niet gevonden in backup
)

if exist "%BACKUP_DIR%\tsconfig.node.json" (
    copy "%BACKUP_DIR%\tsconfig.node.json" . >nul
    echo ✅ tsconfig.node.json hersteld
)

echo.
echo [STAP 2] Jest configuratie terugzetten...
if exist "%BACKUP_DIR%\jest.config.js" (
    copy "%BACKUP_DIR%\jest.config.js" . >nul
    echo ✅ jest.config.js hersteld
) else (
    echo ❌ jest.config.js niet gevonden in backup
)

echo.
echo [STAP 3] Playwright configuratie terugzetten...
if exist "%BACKUP_DIR%\playwright.config.ts" (
    copy "%BACKUP_DIR%\playwright.config.ts" . >nul
    echo ✅ playwright.config.ts hersteld
) else (
    echo ❌ playwright.config.ts niet gevonden in backup
)

echo.
echo [STAP 4] E2E tests directory terugzetten...
if exist "%BACKUP_DIR%\e2e" (
    xcopy "%BACKUP_DIR%\e2e" "e2e" /E /I /Q >nul
    echo ✅ e2e/ directory hersteld
) else (
    echo ❌ e2e/ directory niet gevonden in backup
)

echo.
echo [STAP 5] Package.json met testing scripts terugzetten...
if exist "%BACKUP_DIR%\package.json" (
    copy "%BACKUP_DIR%\package.json" . >nul
    echo ✅ package.json hersteld (inclusief test scripts)
) else (
    echo ❌ package.json niet gevonden in backup
)

echo.
echo [STAP 6] TypeScript types directory terugzetten...
if exist "%BACKUP_DIR%\src\types" (
    if not exist "src" mkdir src
    xcopy "%BACKUP_DIR%\src\types" "src\types" /E /I /Q >nul
    echo ✅ src/types/ directory hersteld
) else (
    echo ❌ src/types/ directory niet gevonden in backup
)

echo.
echo [STAP 7] Vite configuratie terugzetten...
if exist "%BACKUP_DIR%\vite.config.ts" (
    copy "%BACKUP_DIR%\vite.config.ts" . >nul
    echo ✅ vite.config.ts hersteld
)

if exist "%BACKUP_DIR%\vite.config.js" (
    copy "%BACKUP_DIR%\vite.config.js" . >nul
    echo ✅ vite.config.js hersteld
)

echo.
echo [STAP 8] Dependencies installeren...
echo 📦 Installeren van TypeScript en testing dependencies...
call npm install
echo ✅ Dependencies geïnstalleerd

echo.
echo [STAP 9] Playwright browsers installeren...
echo 🌐 Installeren van Playwright browsers...
call npx playwright install
echo ✅ Playwright browsers geïnstalleerd

echo.
echo ============================================
echo ✅ TYPESCRIPT & TESTING SETUP HERSTELD!
echo ============================================
echo.
echo 📋 Wat er hersteld is:
echo    ✅ TypeScript configuratie (tsconfig.json)
echo    ✅ Jest unit testing (jest.config.js)
echo    ✅ Playwright E2E testing (playwright.config.ts)
echo    ✅ E2E test bestanden (e2e/ directory)
echo    ✅ TypeScript types (src/types/ directory)
echo    ✅ Vite configuratie met TypeScript
echo    ✅ All testing dependencies
echo    ✅ Test scripts in package.json
echo.
echo 🧪 Beschikbare test commands:
echo    npm test                - Jest unit tests
echo    npm run test:watch      - Jest in watch mode
echo    npm run test:coverage   - Coverage report
echo    npm run e2e             - Playwright E2E tests
echo    npm run e2e:ui          - Playwright UI mode
echo    npm run type-check      - TypeScript check
echo.
echo 🚀 Om te starten:
echo    npm run dev             - Start development server
echo    npm run e2e             - Run E2E tests
echo.
echo 💡 Vergeet niet je andere componenten/pages terug te kopiëren vanuit backup-temp/src/
echo.
pause