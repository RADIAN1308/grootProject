# Farm Supply Chain Frontend Setup

## Overview
This React application provides a modern web interface for managing a blockchain-based supply chain for farm produce. It connects to the Ethereum smart contracts deployed on Ganache.

## Prerequisites

### 1. Ganache Setup
- Download and install [Ganache](https://trufflesuite.com/ganache/)
- Start Ganache on **port 7545** (default)
- Make sure you have at least 4-5 accounts with ETH

### 2. MetaMask Configuration
- Install [MetaMask browser extension](https://metamask.io/)
- Add a new network with these settings:
  - Network Name: `Ganache Local`
  - RPC URL: `http://127.0.0.1:7545`
  - Chain ID: `1337`
  - Currency Symbol: `ETH`
- Import at least 2-3 Ganache accounts using their private keys

### 3. Smart Contract Deployment
Navigate to the root project directory and deploy contracts:
```bash
cd d:\Blockchain\grootProject\grootProject
truffle compile
truffle migrate --reset
```
Note the deployed contract address from the migration output.

## Starting the Frontend

### Method 1: Using the Batch File
1. Double-click `start-frontend.bat` in the `groot` folder
2. Follow the prompts

### Method 2: Manual Command
```bash
cd d:\Blockchain\grootProject\grootProject\groot
npm start
```

### Method 3: If PowerShell Issues
Open Command Prompt (not PowerShell) and run:
```cmd
cd "d:\Blockchain\grootProject\grootProject\groot"
npm start
```

## Application Features

### 🌱 **Actor Registration**
- Register as different supply chain actors:
  - **Farmer**: Create and harvest products
  - **Processor**: Process raw farm products
  - **Distributor**: Ship and distribute products
  - **Retailer**: Receive and sell products to consumers

### 📦 **Product Management**
- **Create Products** (Farmers only): Add new farm products to the supply chain
- **Transfer Products**: Move products between actors
- **Change States**: Update product status through the supply chain
- **Purchase Products**: Final sale to consumers

### 📊 **Dashboard Features**
- View all products in the supply chain
- Search and filter products by status
- Real-time updates from blockchain
- Complete product history tracking

### 🔗 **Blockchain Integration**
- Web3.js integration for Ethereum interaction
- MetaMask wallet connection
- Real-time contract event listening
- Transaction confirmation and error handling

## Product States
1. **Harvested** (0) - Initial state when farmer creates product
2. **Processed** (1) - After processing by processor
3. **Shipped** (2) - When distributor ships product
4. **Received** (3) - When retailer receives product
5. **Sold** (4) - Final state when sold to consumer

## Actor Workflow

### Farmer Workflow
1. Register as Farmer
2. Create products with details (name, quantity, origin, description)
3. Transfer products to Processors

### Processor Workflow
1. Register as Processor
2. Receive products from Farmers
3. Mark products as "Processed"
4. Transfer to Distributors

### Distributor Workflow
1. Register as Distributor
2. Receive processed products
3. Mark as "Shipped"
4. Transfer to Retailers

### Retailer Workflow
1. Register as Retailer
2. Receive shipped products
3. Mark as "Received"
4. Sell to consumers (mark as "Sold")

## Troubleshooting

### Common Issues

**1. Cannot connect to MetaMask**
- Make sure MetaMask is installed and unlocked
- Check that you're connected to the correct network (Ganache)
- Verify RPC URL is `http://127.0.0.1:7545`

**2. Contract interaction fails**
- Verify contracts are deployed on Ganache
- Check that the contract address in App.js matches deployed address
- Ensure you have sufficient ETH for gas fees

**3. PowerShell execution policy errors**
- Use Command Prompt instead of PowerShell
- Or run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

**4. Network connection issues**
- Restart Ganache
- Reconnect MetaMask to the network
- Refresh the browser page

**5. Transaction failures**
- Check if you're registered as the correct actor type
- Verify you own the product you're trying to modify
- Ensure the product state allows the action you're trying to perform

### State Change Rules
- Only product owners can transfer products
- Only processors can mark products as "Processed"
- Only distributors can mark products as "Shipped"
- Only retailers can mark products as "Received" and "Sold"

## File Structure
```
groot/
├── src/
│   ├── App.js              # Main application component
│   ├── AppNew.css          # Modern styling
│   ├── contracts/
│   │   └── SupplyChain.json # Contract ABI
│   └── ...
├── public/
├── package.json
└── start-frontend.bat      # Easy startup script
```

## Development Notes

### Contract Address
The application is configured to use the deployed contract at:
`0x50f003f7681bBd65E37e79661f90BB8748f511F7`

If you redeploy contracts, update this address in `App.js`.

### Styling
The application uses a modern, responsive design with:
- Green color scheme representing agriculture
- Card-based layout for products
- Responsive design for mobile devices
- Accessible UI with proper contrast

### Web3 Integration
- Automatic MetaMask detection and connection
- Error handling for network issues
- Real-time blockchain state synchronization
- Gas estimation for transactions

## Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify Ganache is running and contracts are deployed
3. Ensure MetaMask is properly configured
4. Check that you have sufficient ETH for transactions

Happy farming! 🚜🌾