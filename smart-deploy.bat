@echo off
REM Farm Supply Chain - Smart Deployment Script for Windows
REM This script handles the complete deployment process with error checking

echo Farm Supply Chain - Smart Deployment
echo =====================================
echo.

echo Starting automatic deployment process...
echo.

REM Step 1: Check if Ganache is running
echo [1/4] Checking if Ganache is running...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:7545' -Method POST -Headers @{'Content-Type'='application/json'} -Body '{\"jsonrpc\":\"2.0\",\"method\":\"web3_clientVersion\",\"params\":[],\"id\":1}' -ErrorAction Stop; echo '✅ Ganache is running'; exit 0 } catch { echo '❌ Ganache is not running on port 7545'; echo 'Please start Ganache and configure it on port 7545'; exit 1 }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Deployment failed: Ganache is not accessible
    pause
    exit /b 1
)
echo.

REM Step 2: Install dependencies if needed
echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing root dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install root dependencies
        pause
        exit /b 1
    )
)

if not exist "groot\node_modules" (
    echo Installing frontend dependencies...
    cd groot
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)
echo ✅ Dependencies are ready
echo.

REM Step 3: Deploy contracts
echo [3/4] Deploying smart contracts...
truffle migrate --reset
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Contract deployment failed
    echo Please check Ganache is running and configured correctly
    pause
    exit /b 1
)
echo ✅ Contracts deployed successfully
echo.

REM Step 4: Update frontend configuration
echo [4/4] Updating frontend configuration...
node groot\scripts\update-contract-address.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to update frontend configuration
    pause
    exit /b 1
)
echo ✅ Frontend updated with new contract address
echo.

echo =====================================
echo 🎉 Deployment completed successfully!
echo =====================================
echo.
echo Next steps:
echo   1. Make sure MetaMask is connected to Ganache network
echo   2. Import a Ganache account to MetaMask  
echo   3. Double-click 'start-frontend.bat' to run the app
echo.
echo The application will be available at: http://localhost:3000
echo.
pause