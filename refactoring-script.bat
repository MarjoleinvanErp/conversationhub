@echo off
echo ============================================
echo Enhanced Live Transcription Refactoring
echo ConversationHub - Component Restructuring
echo ============================================
echo.

:: Navigeer naar project root
cd /d C:\conversationhub\frontend\src\components\recording

:: Backup maken van huidige component
echo [STEP 1] Backup maken van huidige component...
copy EnhancedLiveTranscription.jsx EnhancedLiveTranscription.backup.jsx
if exist "EnhancedLiveTranscription backup.jsx" (
    copy "EnhancedLiveTranscription backup.jsx" EnhancedLiveTranscription.backup2.jsx
)
echo ✅ Backup gemaakt

:: Nieuwe directory structure aanmaken
echo.
echo [STEP 2] Nieuwe directory structuur aanmaken...
mkdir EnhancedLiveTranscription 2>nul
cd EnhancedLiveTranscription

:: Main directories
mkdir components 2>nul
mkdir hooks 2>nul
mkdir services 2>nul
mkdir types 2>nul
mkdir __tests__ 2>nul
mkdir __e2e__ 2>nul

:: Sub-directories voor tests
cd __tests__
mkdir hooks 2>nul
mkdir components 2>nul
mkdir services 2>nul
cd ..

:: Component test directories
cd components
mkdir __tests__ 2>nul
cd ..

:: Hook test directories  
cd hooks
mkdir __tests__ 2>nul
cd ..

echo ✅ Directory structuur aangemaakt

:: Type definitions aanmaken
echo.
echo [STEP 3] TypeScript type definitions aanmaken...
cd types

:: Maak index.ts aan
echo // Enhanced Live Transcription TypeScript Definitions > index.ts
echo // ConversationHub - Modular Component Types >> index.ts
echo. >> index.ts
echo // Session Management Types >> index.ts
echo export interface SessionState { >> index.ts
echo   sessionActive: boolean; >> index.ts
echo   sessionId: string ^| null; >> index.ts
echo   isStartingSession: boolean; >> index.ts
echo   startupProgress: string; >> index.ts
echo   error: string ^| null; >> index.ts
echo } >> index.ts
echo. >> index.ts
echo // TODO: Vul aan met volledige types uit artifact >> index.ts

cd ..
echo ✅ Type definitions template aangemaakt

:: Custom hooks aanmaken
echo.
echo [STEP 4] Custom hooks aanmaken...
cd hooks

:: useSessionManager
echo // useSessionManager Hook - Session Lifecycle Management > useSessionManager.ts
echo import { useState, useCallback } from 'react'; >> useSessionManager.ts
echo import type { SessionState, UseSessionManagerReturn } from '../types'; >> useSessionManager.ts
echo. >> useSessionManager.ts
echo // TODO: Implementeer volledig vanuit artifact >> useSessionManager.ts

:: useAudioRecorder  
echo // useAudioRecorder Hook - Audio Recording Logic > useAudioRecorder.ts
echo import { useState, useEffect, useRef, useCallback } from 'react'; >> useAudioRecorder.ts
echo import type { RecordingState, UseAudioRecorderReturn } from '../types'; >> useAudioRecorder.ts
echo. >> useAudioRecorder.ts
echo // TODO: Implementeer volledig vanuit artifact >> useAudioRecorder.ts

:: useTranscriptionProcessor
echo // useTranscriptionProcessor Hook - Processing Logic > useTranscriptionProcessor.ts
echo import { useState, useCallback } from 'react'; >> useTranscriptionProcessor.ts
echo import type { AudioProcessingState, SessionStats } from '../types'; >> useTranscriptionProcessor.ts
echo. >> useTranscriptionProcessor.ts
echo // TODO: Implementeer volledig vanuit artifact >> useTranscriptionProcessor.ts

:: useVoiceSetup
echo // useVoiceSetup Hook - Voice Profile Setup > useVoiceSetup.ts
echo import { useState, useCallback } from 'react'; >> useVoiceSetup.ts
echo import type { VoiceSetupState, UseVoiceSetupReturn } from '../types'; >> useVoiceSetup.ts
echo. >> useVoiceSetup.ts
echo // TODO: Implementeer volledig vanuit artifact >> useVoiceSetup.ts

cd ..
echo ✅ Custom hooks templates aangemaakt

:: UI Components aanmaken
echo.
echo [STEP 5] UI Components aanmaken...
cd components

:: SessionSetup
echo // SessionSetup Component - Voice setup and session initialization > SessionSetup.tsx
echo import React from 'react'; >> SessionSetup.tsx
echo import type { SessionSetupProps } from '../types'; >> SessionSetup.tsx
echo. >> SessionSetup.tsx
echo // TODO: Implementeer volledig >> SessionSetup.tsx

:: RecordingControls
echo // RecordingControls Component - Start/Stop/Pause controls > RecordingControls.tsx
echo import React from 'react'; >> RecordingControls.tsx
echo import { Box, Button, Tooltip, IconButton } from '@mui/material'; >> RecordingControls.tsx
echo import type { RecordingControlsProps } from '../types'; >> RecordingControls.tsx
echo. >> RecordingControls.tsx
echo // TODO: Implementeer volledig vanuit artifact >> RecordingControls.tsx

:: RecordingStatus
echo // RecordingStatus Component - Status display and statistics > RecordingStatus.tsx
echo import React from 'react'; >> RecordingStatus.tsx
echo import type { RecordingStatusProps } from '../types'; >> RecordingStatus.tsx
echo. >> RecordingStatus.tsx
echo // TODO: Implementeer volledig >> RecordingStatus.tsx

:: TranscriptionOutput
echo // TranscriptionOutput Component - Live transcription display > TranscriptionOutput.tsx
echo import React from 'react'; >> TranscriptionOutput.tsx
echo import type { TranscriptionOutputProps } from '../types'; >> TranscriptionOutput.tsx
echo. >> TranscriptionOutput.tsx
echo // TODO: Implementeer volledig >> TranscriptionOutput.tsx

cd ..
echo ✅ UI Components templates aangemaakt

:: Services aanmaken
echo.
echo [STEP 6] Services aanmaken...
cd services

echo // Transcription Coordinator - Business Logic Orchestration > transcriptionCoordinator.ts
echo import type { SessionConfig, LiveTranscription } from '../types'; >> transcriptionCoordinator.ts
echo. >> transcriptionCoordinator.ts
echo // TODO: Business logic coordinatie implementeren >> transcriptionCoordinator.ts

cd ..

:: Main container aanmaken
echo.
echo [STEP 7] Main container component aanmaken...
echo // EnhancedLiveTranscriptionContainer - Main Coordinator Component > EnhancedLiveTranscriptionContainer.tsx
echo import React, { useState, useEffect, useCallback } from 'react'; >> EnhancedLiveTranscriptionContainer.tsx
echo import { Box, Alert, CircularProgress, Typography } from '@mui/material'; >> EnhancedLiveTranscriptionContainer.tsx
echo. >> EnhancedLiveTranscriptionContainer.tsx
echo // Components >> EnhancedLiveTranscriptionContainer.tsx
echo import SessionSetup from './components/SessionSetup'; >> EnhancedLiveTranscriptionContainer.tsx
echo import RecordingControls from './components/RecordingControls'; >> EnhancedLiveTranscriptionContainer.tsx
echo. >> EnhancedLiveTranscriptionContainer.tsx
echo // TODO: Implementeer volledig vanuit artifact >> EnhancedLiveTranscriptionContainer.tsx

:: Export barrel aanmaken
echo.
echo [STEP 8] Export barrel aanmaken...
echo // Enhanced Live Transcription Export Barrel > index.ts
echo // Central export point for all components and utilities >> index.ts
echo. >> index.ts
echo // Main Component >> index.ts
echo export { default as EnhancedLiveTranscriptionContainer } from './EnhancedLiveTranscriptionContainer'; >> index.ts
echo export { default } from './EnhancedLiveTranscriptionContainer'; >> index.ts
echo. >> index.ts
echo // Sub-components >> index.ts
echo export { default as SessionSetup } from './components/SessionSetup'; >> index.ts
echo export { default as RecordingControls } from './components/RecordingControls'; >> index.ts
echo. >> index.ts
echo // Custom Hooks >> index.ts
echo export { useSessionManager } from './hooks/useSessionManager'; >> index.ts
echo export { useAudioRecorder } from './hooks/useAudioRecorder'; >> index.ts
echo. >> index.ts
echo // Types >> index.ts
echo export type * from './types'; >> index.ts

echo ✅ Export barrel aangemaakt

:: Unit tests templates aanmaken
echo.
echo [STEP 9] Unit tests templates aanmaken...
cd __tests__\hooks

:: useSessionManager test
echo // useSessionManager Hook Unit Tests > useSessionManager.test.ts
echo import { renderHook, act } from '@testing-library/react'; >> useSessionManager.test.ts
echo import { useSessionManager } from '../../hooks/useSessionManager'; >> useSessionManager.test.ts
echo. >> useSessionManager.test.ts
echo // TODO: Implementeer volledige tests vanuit artifact >> useSessionManager.test.ts

:: useAudioRecorder test
echo // useAudioRecorder Hook Unit Tests > useAudioRecorder.test.ts
echo import { renderHook, act } from '@testing-library/react'; >> useAudioRecorder.test.ts
echo import { useAudioRecorder } from '../../hooks/useAudioRecorder'; >> useAudioRecorder.test.ts
echo. >> useAudioRecorder.test.ts
echo // TODO: Implementeer tests >> useAudioRecorder.test.ts

cd ..\components

:: RecordingControls test
echo // RecordingControls Component Unit Tests > RecordingControls.test.tsx
echo import React from 'react'; >> RecordingControls.test.tsx
echo import { render, screen, userEvent } from '@testing-library/react'; >> RecordingControls.test.tsx
echo import RecordingControls from '../../components/RecordingControls'; >> RecordingControls.test.tsx
echo. >> RecordingControls.test.tsx
echo // TODO: Implementeer component tests >> RecordingControls.test.tsx

cd ..\..

:: E2E tests aanmaken
echo.
echo [STEP 10] E2E tests aanmaken...
cd __e2e__

echo // Enhanced Live Transcription E2E Tests > enhanced-live-transcription.spec.ts
echo import { test, expect, Page } from '@playwright/test'; >> enhanced-live-transcription.spec.ts
echo. >> enhanced-live-transcription.spec.ts
echo test.describe('Enhanced Live Transcription', () =^> { >> enhanced-live-transcription.spec.ts
echo   // TODO: Implementeer E2E tests vanuit artifact >> enhanced-live-transcription.spec.ts
echo }); >> enhanced-live-transcription.spec.ts

cd ..

:: Package.json scripts updaten
echo.
echo [STEP 11] Package.json scripts voorbereiden...
cd ..\..\..

echo. > package-scripts-addition.txt
echo // Voeg deze scripts toe aan package.json: >> package-scripts-addition.txt
echo "scripts": { >> package-scripts-addition.txt
echo   "test:transcription": "jest src/components/recording/EnhancedLiveTranscription", >> package-scripts-addition.txt
echo   "test:transcription:watch": "jest src/components/recording/EnhancedLiveTranscription --watch", >> package-scripts-addition.txt
echo   "test:transcription:coverage": "jest src/components/recording/EnhancedLiveTranscription --coverage", >> package-scripts-addition.txt
echo   "e2e:transcription": "playwright test enhanced-live-transcription.spec.ts" >> package-scripts-addition.txt
echo } >> package-scripts-addition.txt

echo ✅ Package scripts template gemaakt

:: Update imports in MeetingRoomTabs
echo.
echo [STEP 12] Import updates voorbereiden...
cd src\pages\meeting\components

:: Backup MeetingRoomTabs
if exist MeetingRoomTabs.jsx (
    copy MeetingRoomTabs.jsx MeetingRoomTabs.backup.jsx
)

echo. > import-update-instructions.txt
echo // UPDATE IMPORTS in MeetingRoomTabs.jsx: >> import-update-instructions.txt
echo. >> import-update-instructions.txt
echo // OUDE IMPORT (vervang deze): >> import-update-instructions.txt
echo import EnhancedLiveTranscription from '../../../components/recording/EnhancedLiveTranscription.jsx'; >> import-update-instructions.txt
echo. >> import-update-instructions.txt
echo // NIEUWE IMPORT (gebruik deze): >> import-update-instructions.txt
echo import EnhancedLiveTranscription from '../../../components/recording/EnhancedLiveTranscription'; >> import-update-instructions.txt

cd ..\..\..\..

:: Samenvatting tonen
echo.
echo ============================================
echo REFACTORING VOLTOOID! 
echo ============================================
echo.
echo ✅ Nieuwe modulaire structuur aangemaakt in:
echo    📁 frontend\src\components\recording\EnhancedLiveTranscription\
echo.
echo ✅ Templates aangemaakt voor:
echo    🏗️  Main Container Component
echo    🎣 4 Custom Hooks (Session, Audio, Processing, Voice)  
echo    🖼️  4 UI Components (Setup, Controls, Status, Output)
echo    📝 TypeScript Type Definitions
echo    🧪 Unit Test Templates
echo    🎭 E2E Test Templates
echo    📦 Export Barrel
echo.
echo ⚠️  VOLGENDE STAPPEN:
echo    1. Kopieer volledig code vanuit artifacts naar template bestanden
echo    2. Update import in MeetingRoomTabs.jsx (zie import-update-instructions.txt)
echo    3. Voeg scripts toe aan package.json (zie package-scripts-addition.txt)
echo    4. Test de nieuwe structuur: npm run test:transcription
echo    5. Verwijder oude EnhancedLiveTranscription.jsx als alles werkt
echo.
echo 📋 BESTANDEN OVERZICHT:
echo    📂 EnhancedLiveTranscription\
echo       ├── EnhancedLiveTranscriptionContainer.tsx
echo       ├── index.ts (export barrel)
echo       ├── types\index.ts
echo       ├── hooks\useSessionManager.ts
echo       ├── hooks\useAudioRecorder.ts
echo       ├── hooks\useTranscriptionProcessor.ts
echo       ├── hooks\useVoiceSetup.ts
echo       ├── components\SessionSetup.tsx
echo       ├── components\RecordingControls.tsx
echo       ├── components\RecordingStatus.tsx
echo       ├── components\TranscriptionOutput.tsx
echo       ├── services\transcriptionCoordinator.ts
echo       ├── __tests__\hooks\*.test.ts
echo       ├── __tests__\components\*.test.tsx
echo       └── __e2e__\enhanced-live-transcription.spec.ts
echo.
echo 🔧 BACKUP BESTANDEN:
echo    📄 EnhancedLiveTranscription.backup.jsx (origineel)
echo    📄 MeetingRoomTabs.backup.jsx (origineel)
echo.
echo Klaar voor implementatie! 🚀
pause