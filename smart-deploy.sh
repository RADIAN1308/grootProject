#!/bin/bash

# Farm Supply Chain - Smart Deployment Script
# This script handles the complete deployment process with error checking

echo "🚀 Farm Supply Chain - Smart Deployment"
echo "======================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $2 in
        "error") echo -e "${RED}❌ $1${NC}" ;;
        "success") echo -e "${GREEN}✅ $1${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $1${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $1${NC}" ;;
        *) echo "$1" ;;
    esac
}

# Check if Ganache is running
check_ganache() {
    print_status "Checking if Ganache is running..." "info"
    
    if curl -s -X POST -H "Content-Type: application/json" \
       -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' \
       http://127.0.0.1:7545 > /dev/null 2>&1; then
        print_status "Ganache is running on port 7545" "success"
        return 0
    else
        print_status "Ganache is not running on port 7545" "error"
        echo "Please start Ganache and configure it on port 7545"
        return 1
    fi
}

# Deploy contracts with error handling
deploy_contracts() {
    print_status "Deploying smart contracts..." "info"
    
    if truffle migrate --reset; then
        print_status "Contracts deployed successfully" "success"
        return 0
    else
        print_status "Contract deployment failed" "error"
        return 1
    fi
}

# Update frontend contract address
update_frontend() {
    print_status "Updating frontend configuration..." "info"
    
    if node groot/scripts/update-contract-address.js; then
        print_status "Frontend updated with new contract address" "success"
        return 0
    else
        print_status "Failed to update frontend configuration" "error"
        return 1
    fi
}

# Install dependencies if needed
install_deps() {
    if [ ! -d "node_modules" ]; then
        print_status "Installing root dependencies..." "info"
        npm install
    fi
    
    if [ ! -d "groot/node_modules" ]; then
        print_status "Installing frontend dependencies..." "info"
        cd groot
        npm install
        cd ..
    fi
    
    print_status "Dependencies are ready" "success"
}

# Main deployment process
main() {
    echo "Starting automatic deployment process..."
    echo
    
    # Step 1: Check Ganache
    if ! check_ganache; then
        exit 1
    fi
    echo
    
    # Step 2: Install dependencies
    install_deps
    echo
    
    # Step 3: Deploy contracts
    if ! deploy_contracts; then
        exit 1
    fi
    echo
    
    # Step 4: Update frontend
    if ! update_frontend; then
        exit 1
    fi
    echo
    
    print_status "🎉 Deployment completed successfully!" "success"
    echo
    print_status "Next steps:" "info"
    echo "  1. Make sure MetaMask is connected to Ganache network"
    echo "  2. Import a Ganache account to MetaMask"
    echo "  3. Run: cd groot && npm start"
    echo
    print_status "The application will be available at: http://localhost:3000" "info"
}

# Run main function
main