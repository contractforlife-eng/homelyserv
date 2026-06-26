@echo off
echo ========================================
echo    🔧 FIXING HOMELYSERV APP
echo ========================================
echo.

echo [1/4] Fixing Backend...
cd backend
echo Updating package.json...
powershell -Command "(Get-Content package.json) -replace '\"type\": \"module\",', '' | Set-Content package.json"
echo.

echo [2/4] Fixing Vite Config...
cd ..\frontend
echo Creating correct vite.config.js...
(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo.
echo export default defineConfig({
echo   plugins: [react()],
echo   server: {
echo     port: 5173,
echo     open: true,
echo   },
echo })
) > vite.config.js
echo.

echo [3/4] Installing dependencies...
cd backend
call npm install
cd ..\frontend
call npm install
echo.

echo [4/4] Starting servers...
echo.
echo Starting Backend...
start "HomelyServ Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "HomelyServ Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ✅ Fix complete! Servers are starting...
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:5000
echo ========================================
echo.
pause