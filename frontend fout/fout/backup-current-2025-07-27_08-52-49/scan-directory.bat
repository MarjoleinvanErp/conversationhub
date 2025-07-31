@echo off
echo ============================================
echo ConversationHub Frontend Directory Scanner
echo Complete overzicht van alle bestanden
echo ============================================
echo.

cd /d C:\conversationhub\frontend

echo [ROOT LEVEL] - C:\conversationhub\frontend\
dir /B
echo.

echo [DETAILED ROOT] - Bestanden met datum/grootte:
dir
echo.

echo [SRC DIRECTORY] - Volledige src/ structuur:
if exist src (
    tree src /F
) else (
    echo ❌ src/ directory bestaat niet
)
echo.

echo [E2E DIRECTORY] - E2E test structuur:
if exist e2e (
    tree e2e /F
) else (
    echo ❌ e2e/ directory bestaat niet
)
echo.

echo [NODE_MODULES] - Controleer dependencies:
if exist node_modules (
    echo ✅ node_modules bestaat (dependencies geïnstalleerd)
    echo Aantal packages:
    dir node_modules /B | find /c /v ""
) else (
    echo ❌ node_modules bestaat niet
)
echo.

echo [BACKUP DIRECTORIES] - Backup overzicht:
if exist backup-temp (
    echo ✅ backup-temp bestaat
    echo Inhoud:
    dir backup-temp /B
) else (
    echo ❌ backup-temp bestaat niet
)
echo.

if exist backup-temp-old (
    echo ✅ backup-temp-old bestaat
    echo Aantal items:
    dir backup-temp-old /B | find /c /v ""
) else (
    echo ❌ backup-temp-old bestaat niet
)
echo.

echo [CONFIG FILES] - Configuratie bestanden check:
for %%f in (package.json tsconfig.json playwright.config.ts vite.config.ts jest.config.js) do (
    if exist %%f (
        echo ✅ %%f bestaat
    ) else (
        echo ❌ %%f ontbreekt
    )
)
echo.

echo [SRC SUBDIRECTORIES] - Gedetailleerd src overzicht:
if exist src (
    for /d %%d in (src\*) do (
        echo.
        echo === %%d ===
        tree "%%d" /F
    )
) else (
    echo ❌ src/ directory bestaat niet
)
echo.

echo ============================================
echo SCAN VOLTOOID
echo ============================================
pause