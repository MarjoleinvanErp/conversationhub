@echo off
echo ============================================
echo ConversationHub Frontend Cleanup Script
echo Verplaatst alle frontend bestanden naar backup-temp
echo ============================================
echo.

:: Stel de project root directory in
set PROJECT_ROOT=C:\conversationhub\frontend
set BACKUP_DIR=%PROJECT_ROOT%\backup-temp
set TIMESTAMP=%date:~-4,4%-%date:~-7,2%-%date:~-10,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

:: Navigeer naar project root
cd /d "%PROJECT_ROOT%"

if not exist "%PROJECT_ROOT%" (
    echo ❌ FOUT: Project directory niet gevonden: %PROJECT_ROOT%
    echo Pas de PROJECT_ROOT variabele aan in het script
    pause
    exit /b 1
)

echo 📁 Project directory: %PROJECT_ROOT%
echo 📁 Backup directory: %BACKUP_DIR%
echo 🕐 Timestamp: %TIMESTAMP%
echo.

:: Maak backup directory aan
echo [STAP 1] Backup directory aanmaken...
if exist "%BACKUP_DIR%" (
    echo ⚠️  Backup directory bestaat al, hernoemen naar backup-temp-old
    if exist "%BACKUP_DIR%-old" (
        echo 🗑️  Verwijderen oude backup-temp-old...
        rmdir /s /q "%BACKUP_DIR%-old"
    )
    move "%BACKUP_DIR%" "%BACKUP_DIR%-old"
)
mkdir "%BACKUP_DIR%"
echo ✅ Backup directory aangemaakt

:: Maak een info bestand met details
echo [STAP 2] Backup info bestand maken...
echo ConversationHub Frontend Backup > "%BACKUP_DIR%\BACKUP_INFO.txt"
echo Aangemaakt op: %date% %time% >> "%BACKUP_DIR%\BACKUP_INFO.txt"
echo Van directory: %PROJECT_ROOT% >> "%BACKUP_DIR%\BACKUP_INFO.txt"
echo. >> "%BACKUP_DIR%\BACKUP_INFO.txt"
echo ===== INHOUD VOOR BACKUP ===== >> "%BACKUP_DIR%\BACKUP_INFO.txt"
dir /b "%PROJECT_ROOT%" >> "%BACKUP_DIR%\BACKUP_INFO.txt"
echo ✅ Backup info bestand gemaakt

:: Verplaats alle bestanden en mappen BEHALVE backup-temp
echo.
echo [STAP 3] Verplaatsen van bestanden en directories...
echo.

:: Lijst van items om te verplaatsen
for /f "delims=" %%i in ('dir /b "%PROJECT_ROOT%"') do (
    if /i not "%%i"=="backup-temp" (
        if /i not "%%i"=="backup-temp-old" (
            echo 📦 Verplaatsen: %%i
            move "%PROJECT_ROOT%\%%i" "%BACKUP_DIR%\%%i" >nul 2>&1
            if errorlevel 1 (
                echo ❌ FOUT bij verplaatsen van: %%i
            ) else (
                echo ✅ Verplaatst: %%i
            )
        )
    )
)

:: Controleer resultaat
echo.
echo [STAP 4] Verificatie van backup...
echo.
echo 📊 Inhoud van backup directory:
dir /b "%BACKUP_DIR%"

echo.
echo 📊 Inhoud van frontend directory (na cleanup):
dir /b "%PROJECT_ROOT%"

echo.
echo ============================================
echo ✅ FRONTEND CLEANUP VOLTOOID!
echo ============================================
echo.
echo 📁 Alle bestanden zijn verplaatst naar:
echo    %BACKUP_DIR%
echo.
echo 🔄 Om bestanden terug te zetten, gebruik:
echo    move "%BACKUP_DIR%\*" "%PROJECT_ROOT%\"
echo.
echo 💡 Tips voor opnieuw beginnen:
echo    1. Maak nieuwe src/ directory aan
echo    2. Kopieer belangrijke config bestanden terug (package.json, vite.config.ts, etc.)
echo    3. Installeer dependencies: npm install
echo    4. Start development server: npm run dev
echo.
echo ⚠️  Let op: Vergeet niet je .env bestanden terug te kopiëren als die er waren!
echo.
pause