@echo off
echo ============================================
echo ConversationHub Frontend Restructuring
echo Modern React/TypeScript Architecture Setup
echo ============================================
echo.

:: Navigeer naar frontend directory
cd /d C:\conversationhub\frontend

:: Backup maken van huidige src
echo [STEP 1] Backup maken van huidige src folder...
if exist src-backup rmdir /s /q src-backup
xcopy src src-backup\ /E /I /Q
echo ✅ Backup gemaakt in src-backup/

:: Nieuwe src structuur aanmaken
echo.
echo [STEP 2] Nieuwe src structuur aanmaken...

:: Main directories
mkdir src\components 2>nul
mkdir src\pages 2>nul
mkdir src\hooks 2>nul
mkdir src\services 2>nul
mkdir src\types 2>nul
mkdir src\utils 2>nul
mkdir src\styles 2>nul
mkdir src\assets 2>nul

:: Component subdirectories
mkdir src\components\ui 2>nul
mkdir src\components\forms 2>nul
mkdir src\components\layout 2>nul
mkdir src\components\features 2>nul

:: Feature-specific component directories
mkdir src\components\features\recording 2>nul
mkdir src\components\features\transcription 2>nul
mkdir src\components\features\session 2>nul
mkdir src\components\features\dashboard 2>nul
mkdir src\components\features\privacy 2>nul

:: Test directories
mkdir src\__tests__ 2>nul
mkdir src\components\__tests__ 2>nul
mkdir src\hooks\__tests__ 2>nul
mkdir src\services\__tests__ 2>nul
mkdir src\utils\__tests__ 2>nul

:: Assets subdirectories
mkdir src\assets\images 2>nul
mkdir src\assets\icons 2>nul
mkdir src\assets\audio 2>nul

echo ✅ Nieuwe folder structuur aangemaakt

:: Template cleanup
echo.
echo [STEP 3] Template bestanden opruimen...
if exist materialpro-react-lite-master (
    echo Removing MaterialPro template folder...
    rmdir /s /q materialpro-react-lite-master
    echo ✅ MaterialPro template verwijderd
)

echo.
echo [STEP 4] Oude bestanden archiveren...
:: Maak archive folder voor oude bestanden
mkdir archive 2>nul

echo ✅ Restructuring script voltooid!
echo.
echo Volgende stappen:
echo 1. Run het script: restructure-script.bat
echo 2. Configureer TypeScript voor alle componenten
echo 3. Migreer bestaande componenten naar nieuwe structuur
echo 4. Setup barrel exports (index.ts files)
echo.
pause