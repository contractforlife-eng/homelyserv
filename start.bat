@echo off
echo ========================================
echo   HOMELYSERV - Starting Application
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "HomelyServ Backend" cmd /k "cd /d C:\Users\User\Desktop\homelyserv\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting ngrok tunnel...
start "HomelyServ ngrok" cmd /k "cd /d C:\Users\User\Desktop && ngrok http 5000"

echo.
echo ========================================
echo   ✅ HomelyServ is starting!
echo   📱 Frontend: https://homelyserv-nznn.vercel.app
echo   🔗 ngrok: Check the ngrok window for URL
echo ========================================
echo.
echo Press any key to close this window...
pause >nul