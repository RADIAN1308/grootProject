const fs = require('fs');
const path = require('path');

// Read the migration network info
const networkFile = path.join(__dirname, '../../build/contracts/SupplyChain.json');

if (fs.existsSync(networkFile)) {
    const contractData = JSON.parse(fs.readFileSync(networkFile, 'utf8'));
    
    // Find the latest network deployment
    const networks = contractData.networks;
    const networkIds = Object.keys(networks);
    
    if (networkIds.length > 0) {
        // Get the latest deployment (highest network ID or most recent)
        const latestNetworkId = networkIds[networkIds.length - 1];
        const contractAddress = networks[latestNetworkId].address;
        
        console.log('✅ Found deployed contract:');
        console.log('Network ID:', latestNetworkId);
        console.log('Contract Address:', contractAddress);
        
        // Update the React app with the correct address
        const appJsPath = path.join(__dirname, '../src/App.js');
        let appContent = fs.readFileSync(appJsPath, 'utf8');
        
        // Replace the hardcoded address with the deployed one
        const oldAddressRegex = /const SUPPLY_CHAIN_ADDRESS = .*?;/;
        const newAddressLine = `const SUPPLY_CHAIN_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '${contractAddress}';`;
        
        appContent = appContent.replace(oldAddressRegex, newAddressLine);
        fs.writeFileSync(appJsPath, appContent);
        
        console.log('✅ Updated App.js with new contract address');
        console.log('🚀 React app will now use:', contractAddress);
    } else {
        console.log('❌ No deployed networks found');
        console.log('💡 Run: truffle migrate --reset');
    }
} else {
    console.log('❌ Contract build file not found');
    console.log('💡 Run: truffle compile && truffle migrate --reset');
}