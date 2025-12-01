const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔍 Running comprehensive startup checks...\n');

// Color codes for terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// Check if Ganache is running
function checkGanache() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            jsonrpc: "2.0",
            method: "web3_clientVersion",
            params: [],
            id: 1
        });

        const options = {
            hostname: '127.0.0.1',
            port: 7545,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    log('✅ Ganache is running: ' + response.result, 'green');
                    resolve(true);
                } catch (e) {
                    log('❌ Ganache response error', 'red');
                    resolve(false);
                }
            });
        });

        req.on('error', () => {
            log('❌ Ganache is not running on port 7545', 'red');
            resolve(false);
        });

        req.setTimeout(5000, () => {
            log('❌ Ganache connection timeout', 'red');
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Check if contracts are deployed
function checkContracts() {
    const buildPath = path.join(__dirname, '../../build/contracts/SupplyChain.json');
    
    if (!fs.existsSync(buildPath)) {
        log('❌ SupplyChain.json not found - contracts not compiled', 'red');
        return { deployed: false, reason: 'not_compiled' };
    }

    try {
        const contractData = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
        const networks = contractData.networks || {};
        
        if (Object.keys(networks).length === 0) {
            log('❌ No deployed networks found in contract', 'red');
            return { deployed: false, reason: 'not_deployed' };
        }

        // Find the network with deployment
        let deployedNetwork = null;
        let contractAddress = null;

        for (const networkId in networks) {
            if (networks[networkId].address) {
                deployedNetwork = networkId;
                contractAddress = networks[networkId].address;
                break;
            }
        }

        if (contractAddress) {
            log(`✅ Contract deployed on network ${deployedNetwork}`, 'green');
            log(`   Address: ${contractAddress}`, 'blue');
            return { deployed: true, networkId: deployedNetwork, address: contractAddress };
        } else {
            log('❌ No contract address found in deployment', 'red');
            return { deployed: false, reason: 'no_address' };
        }
    } catch (error) {
        log('❌ Error reading contract data: ' + error.message, 'red');
        return { deployed: false, reason: 'read_error' };
    }
}

// Check if frontend has correct contract address
function checkFrontendConfig(expectedAddress) {
    const appPath = path.join(__dirname, '../src/App.js');
    
    if (!fs.existsSync(appPath)) {
        log('❌ App.js not found', 'red');
        return false;
    }

    try {
        const appContent = fs.readFileSync(appPath, 'utf8');
        const addressMatch = appContent.match(/SUPPLY_CHAIN_ADDRESS.*?['"`]([0x[a-fA-F0-9]{40})['"`]/);
        
        if (!addressMatch) {
            log('❌ Contract address not found in App.js', 'red');
            return false;
        }

        const frontendAddress = addressMatch[1];
        
        if (frontendAddress === expectedAddress) {
            log('✅ Frontend has correct contract address', 'green');
            return true;
        } else {
            log(`❌ Frontend address mismatch:`, 'red');
            log(`   Frontend: ${frontendAddress}`, 'yellow');
            log(`   Expected: ${expectedAddress}`, 'yellow');
            return false;
        }
    } catch (error) {
        log('❌ Error reading App.js: ' + error.message, 'red');
        return false;
    }
}

// Check if required dependencies are installed
function checkDependencies() {
    const frontendPackagePath = path.join(__dirname, '../package.json');
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    
    if (!fs.existsSync(frontendPackagePath)) {
        log('❌ Frontend package.json not found', 'red');
        return false;
    }

    if (!fs.existsSync(nodeModulesPath)) {
        log('❌ Node modules not installed - run npm install', 'red');
        return false;
    }

    log('✅ Dependencies are installed', 'green');
    return true;
}

// Auto-fix contract address if needed
function autoFixContractAddress(correctAddress) {
    log('🔧 Attempting to auto-fix contract address...', 'yellow');
    
    try {
        const { execSync } = require('child_process');
        const scriptPath = path.join(__dirname, 'update-contract-address.js');
        
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
        log('✅ Contract address updated automatically', 'green');
        return true;
    } catch (error) {
        log('❌ Auto-fix failed: ' + error.message, 'red');
        return false;
    }
}

// Main check function
async function runStartupChecks() {
    console.log('Farm Supply Chain - Startup Diagnostics');
    console.log('='.repeat(50));
    console.log();

    let allGood = true;
    const issues = [];

    // 1. Check Ganache
    log('1. Checking Ganache connection...', 'blue');
    const ganacheOk = await checkGanache();
    if (!ganacheOk) {
        allGood = false;
        issues.push('start_ganache');
    }
    console.log();

    // 2. Check contracts
    log('2. Checking smart contract deployment...', 'blue');
    const contractStatus = checkContracts();
    if (!contractStatus.deployed) {
        allGood = false;
        issues.push(`deploy_contracts_${contractStatus.reason}`);
    }
    console.log();

    // 3. Check dependencies
    log('3. Checking dependencies...', 'blue');
    const depsOk = checkDependencies();
    if (!depsOk) {
        allGood = false;
        issues.push('install_deps');
    }
    console.log();

    // 4. Check frontend config (if contracts are deployed)
    if (contractStatus.deployed) {
        log('4. Checking frontend configuration...', 'blue');
        const frontendOk = checkFrontendConfig(contractStatus.address);
        if (!frontendOk) {
            log('   Attempting automatic fix...', 'yellow');
            const fixed = autoFixContractAddress(contractStatus.address);
            if (!fixed) {
                allGood = false;
                issues.push('fix_frontend_config');
            }
        }
        console.log();
    }

    // Summary
    console.log('='.repeat(50));
    if (allGood) {
        log('🎉 ALL CHECKS PASSED! Ready to start the application.', 'green');
        console.log();
        log('Next steps:', 'blue');
        log('  1. Make sure MetaMask is connected to Ganache network', 'yellow');
        log('  2. Import a Ganache account into MetaMask', 'yellow');
        log('  3. Run: npm start', 'yellow');
    } else {
        log('⚠️  ISSUES FOUND - Please resolve the following:', 'red');
        console.log();
        
        if (issues.includes('start_ganache')) {
            log('📋 TO DO: Start Ganache', 'yellow');
            log('   - Open Ganache application', '');
            log('   - Start a workspace on port 7545', '');
            log('   - Note the Chain ID (usually 1337 or 5777)', '');
        }
        
        if (issues.some(i => i.startsWith('deploy_contracts'))) {
            log('📋 TO DO: Deploy Smart Contracts', 'yellow');
            log('   - Open terminal in project root', '');
            log('   - Run: truffle migrate --reset', '');
        }
        
        if (issues.includes('install_deps')) {
            log('📋 TO DO: Install Dependencies', 'yellow');
            log('   - Run: npm install (in groot folder)', '');
        }
        
        if (issues.includes('fix_frontend_config')) {
            log('📋 TO DO: Fix Frontend Configuration', 'yellow');
            log('   - Run: node scripts/update-contract-address.js', '');
        }
        
        console.log();
        log('💡 After fixing issues, run this script again to verify.', 'blue');
    }
    
    console.log();
    console.log('='.repeat(50));
    
    return allGood;
}

// Run the checks
runStartupChecks().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    log('💥 Unexpected error: ' + error.message, 'red');
    process.exit(1);
});