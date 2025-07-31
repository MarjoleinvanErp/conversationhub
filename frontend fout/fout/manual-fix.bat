@echo off
echo Creating config files manually...
cd /d "C:\conversationhub\frontend"

echo [CREATING] jest.config.js
echo module.exports = { > jest.config.js
echo   preset: 'ts-jest', >> jest.config.js
echo   testEnvironment: 'jsdom', >> jest.config.js
echo   setupFilesAfterEnv: ['./tests/utils/setupTests.ts'], >> jest.config.js
echo   moduleNameMapping: { >> jest.config.js
echo     '^@/(.*)': './src/$1', >> jest.config.js
echo     '\\.(css^|less^|scss^|sass)$': 'identity-obj-proxy' >> jest.config.js
echo   }, >> jest.config.js
echo   testMatch: [ >> jest.config.js
echo     './tests/**/*.(test^|spec).(ts^|tsx^|js^|jsx)', >> jest.config.js
echo     './src/**/*.(test^|spec).(ts^|tsx^|js^|jsx)' >> jest.config.js
echo   ], >> jest.config.js
echo   collectCoverageFrom: [ >> jest.config.js
echo     'src/**/*.(ts^|tsx^|js^|jsx)', >> jest.config.js
echo     '!src/**/*.d.ts', >> jest.config.js
echo     '!src/main.tsx' >> jest.config.js
echo   ], >> jest.config.js
echo   coverageDirectory: 'coverage', >> jest.config.js
echo   testTimeout: 10000 >> jest.config.js
echo }; >> jest.config.js

echo ✅ Jest config created

echo.
echo [CREATING] index.html
echo ^<!DOCTYPE html^> > index.html
echo ^<html lang="nl"^> >> index.html
echo   ^<head^> >> index.html
echo     ^<meta charset="UTF-8" /^> >> index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^> >> index.html
echo     ^<title^>ConversationHub^</title^> >> index.html
echo   ^</head^> >> index.html
echo   ^<body^> >> index.html
echo     ^<div id="root"^>^</div^> >> index.html
echo     ^<script type="module" src="/src/main.tsx"^>^</script^> >> index.html
echo   ^</body^> >> index.html
echo ^</html^> >> index.html

echo ✅ HTML template created

echo.
echo [CREATING] Essential React files...

:: Create main.tsx
echo import React from 'react' > src\main.tsx
echo import ReactDOM from 'react-dom/client' >> src\main.tsx
echo import App from './App.tsx' >> src\main.tsx
echo import './styles/index.css' >> src\main.tsx
echo. >> src\main.tsx
echo ReactDOM.createRoot(document.getElementById('root')!).render( >> src\main.tsx
echo   ^<React.StrictMode^> >> src\main.tsx
echo     ^<App /^> >> src\main.tsx
echo   ^</React.StrictMode^>, >> src\main.tsx
echo ) >> src\main.tsx

echo ✅ main.tsx created

:: Create basic App.tsx
echo import React from 'react'; > src\App.tsx
echo import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; >> src\App.tsx
echo import './styles/App.css'; >> src\App.tsx
echo. >> src\App.tsx
echo function App() { >> src\App.tsx
echo   return ( >> src\App.tsx
echo     ^<Router^> >> src\App.tsx
echo       ^<div className="App"^> >> src\App.tsx
echo         ^<h1^>ConversationHub^</h1^> >> src\App.tsx
echo         ^<p^>Clean setup successful!^</p^> >> src\App.tsx
echo       ^</div^> >> src\App.tsx
echo     ^</Router^> >> src\App.tsx
echo   ); >> src\App.tsx
echo } >> src\App.tsx
echo. >> src\App.tsx
echo export default App; >> src\App.tsx

echo ✅ App.tsx created

:: Create basic CSS
echo @tailwind base; > src\styles\index.css
echo @tailwind components; >> src\styles\index.css
echo @tailwind utilities; >> src\styles\index.css
echo. >> src\styles\index.css
echo body { >> src\styles\index.css
echo   margin: 0; >> src\styles\index.css
echo   font-family: Inter, system-ui, sans-serif; >> src\styles\index.css
echo } >> src\styles\index.css

echo .App { > src\styles\App.css
echo   text-align: center; >> src\styles\App.css
echo   padding: 2rem; >> src\styles\App.css
echo } >> src\styles\App.css

echo ✅ CSS files created

:: Create basic types
echo // ConversationHub Basic Types > src\types\index.ts
echo export interface User { >> src\types\index.ts
echo   id: string; >> src\types\index.ts
echo   name: string; >> src\types\index.ts
echo   email: string; >> src\types\index.ts
echo } >> src\types\index.ts

echo ✅ Types created

echo.
echo [INSTALLING] Dependencies...
call npm install

echo.
echo [INSTALLING] Playwright...
call npx playwright install

echo.
echo ============================================
echo ✅ BASIC SETUP COMPLETED!
echo ============================================
echo.
echo 🚀 Test your setup:
echo    npm run dev
echo.
echo 📁 Current structure:
echo    src/
echo    ├── components/     (empty, ready for your components)
echo    ├── pages/          (empty, ready for your pages)  
echo    ├── layouts/        (empty, ready for layouts)
echo    ├── hooks/          (empty, ready for hooks)
echo    ├── contexts/       (empty, ready for contexts)
echo    ├── services/       (empty, ready for services)
echo    ├── types/          ✅ Basic types
echo    ├── utils/          (empty, ready for utils)
echo    ├── styles/         ✅ Basic CSS setup
echo    ├── App.tsx         ✅ Basic App component
echo    └── main.tsx        ✅ React entry point
echo.
echo 🧪 Testing ready:
echo    tests/
echo    ├── unit/           (ready for Jest tests)
echo    ├── integration/    (ready for integration tests)
echo    ├── e2e/           (ready for Playwright tests)
echo    ├── fixtures/      (ready for test data)
echo    └── utils/         (ready for test helpers)
echo.
echo 💡 Next steps:
echo    1. npm run dev      - Start development server
echo    2. Create your components in src/components/
echo    3. Add your pages in src/pages/
echo    4. Build your features!
echo.
pause