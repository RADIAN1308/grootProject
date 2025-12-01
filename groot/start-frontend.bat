@echo off
echo Farm Supply Chain - Smart Startup System
echo ========================================
echo.

echo Running comprehensive startup checks...
node scripts/startup-check.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  Startup checks failed. Please resolve the issues above.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ All checks passed! Starting the application...
echo.
echo Make sure MetaMask is:
echo   • Connected to Ganache network (Chain ID: 5777 or 1337)
echo   • Has a Ganache account imported with some ETH
echo.
echo The application will open at: http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.
pause

npm start