# Farm Supply Chain Management System

A comprehensive blockchain-based supply chain management system for farm produce using Ethereum, Solidity, and React. This system provides complete traceability from farm to consumer, enabling transparency and trust in the food supply chain.

## 🚀 Features

### Smart Contract Features
- **Multi-Actor Support**: Farmers, Processors, Distributors, and Retailers
- **Product Lifecycle Management**: Track products from harvest to sale
- **State Management**: Harvested → Processed → Shipped → Received → Sold
- **Ownership Transfer**: Secure transfer of product ownership between actors
- **Quality Certificates**: Add and track quality certifications
- **Purchase System**: End-consumer purchasing with automatic payments
- **Comprehensive History**: Complete audit trail for each product

### Frontend Features
- **Web3 Integration**: Connect with MetaMask for blockchain interaction
- **Dashboard**: View all products and their current status
- **Actor Registration**: Register as different types of supply chain actors
- **Product Creation**: Farmers can create new products
- **Product Management**: Transfer ownership and update product states
- **Product History**: View complete timeline of product journey
- **Purchase Interface**: Consumers can purchase products directly

## 🛠 Technology Stack

- **Blockchain**: Ethereum
- **Smart Contracts**: Solidity ^0.8.21
- **Development Framework**: Truffle Suite
- **Local Blockchain**: Ganache (port 7545)
- **Frontend**: React 19.2.0
- **Web3 Library**: Web3.js
- **Testing**: Truffle Test Suite
- **Wallet Integration**: MetaMask

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.0.0 or higher)
- [npm](https://www.npmjs.com/) (v6.0.0 or higher)
- [Truffle](https://trufflesuite.com/truffle/) - `npm install -g truffle`
- [Ganache](https://trufflesuite.com/ganache/) - GUI or CLI
- [MetaMask](https://metamask.io/) browser extension

## 🚦 Quick Start

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd grootProject

# Install main project dependencies
npm install

# Install frontend dependencies
cd groot
npm install
cd ..
```

### 2. Start Ganache

**Option A: Using Ganache CLI (Recommended)**
```bash
npm run ganache
```

**Option B: Using Ganache GUI**
- Open Ganache GUI
- Create a new workspace or quickstart
- Set the port to `7545`
- Set the network ID to `5777` or use "Any"

### 3. Configure MetaMask

1. Open MetaMask browser extension
2. Add a new network with these details:
   - **Network Name**: Ganache Local
   - **New RPC URL**: http://127.0.0.1:7545
   - **Chain ID**: 1337 (or 5777)
   - **Currency Symbol**: ETH
3. Import accounts using the mnemonic or private keys from Ganache

### 4. Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Ganache
npm run migrate

# Or reset and redeploy (if you've made changes)
npm run migrate:reset
```

### 5. Update Contract Address

After deployment, copy the contract address from the migration output and:

1. Update `REACT_APP_CONTRACT_ADDRESS` in `groot/src/App.js`
2. Or create a `.env` file in the `groot` directory:
   ```
   REACT_APP_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
   ```

### 6. Start the Frontend

```bash
# Start React development server
npm run frontend
```

The application will be available at `http://localhost:3000`

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with detailed output
truffle test --verbose

# Test specific files
truffle test test/supplyChain.test.js
```

### Test Coverage

The test suite covers:
- Actor registration and validation
- Product creation and management
- State transitions and validation
- Ownership transfers
- Quality certificate management
- Purchase transactions
- Error handling and edge cases

## 📖 Usage Guide

### For Farmers

1. **Register as Actor**: Use the "Register Actor" tab to register as a Farmer
2. **Create Products**: Use the "Create Product" tab to add new farm produce
3. **Manage Products**: Transfer products to processors or add quality certificates

### For Processors/Distributors/Retailers

1. **Register as Actor**: Register with your respective actor type
2. **Receive Products**: Accept product transfers from previous supply chain actors
3. **Update Status**: Change product state as it moves through your facility
4. **Transfer Forward**: Send products to the next actor in the chain

### For Consumers

1. **Browse Products**: View available products on the Dashboard
2. **Check History**: Click "View History" to see the complete journey of any product
3. **Purchase**: Buy products that are available at retailers (Received state)

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the variables as needed for your deployment environment.

### Network Configuration

The project is configured for:
- **Development**: Ganache on port 7545
- **Additional networks**: Can be added in `truffle-config.js`

## 🏗 Project Structure

```
grootProject/
├── contracts/              # Solidity smart contracts
│   ├── Migrations.sol      # Migration contract
│   └── SupplyChain.sol     # Main supply chain contract
├── migrations/             # Deployment scripts
│   ├── 1_initial_migration.js
│   └── 2_deploy_supply_chain.js
├── test/                   # Test files
│   └── supplyChain.test.js # Comprehensive contract tests
├── groot/                  # React frontend application
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── App.css        # Styling
│   └── package.json       # Frontend dependencies
├── truffle-config.js      # Truffle configuration
├── package.json          # Main project dependencies
└── README.md             # This file
```

## 🔗 Smart Contract Functions

### Core Functions

- `registerActor(name, location, actorType)` - Register a new supply chain actor
- `createProduct(...)` - Create a new product (Farmers only)
- `transferProduct(productId, newOwner)` - Transfer product ownership
- `changeProductState(productId, newState, notes)` - Update product state
- `purchaseProduct(productId)` - Purchase product (End consumers)
- `addQualityCertificate(productId, certificate)` - Add quality certifications

### View Functions

- `getProduct(productId)` - Get product details
- `getProductHistory(productId)` - Get complete product timeline
- `getActor(address)` - Get actor information
- `getAllProducts()` - Get all product IDs
- `getActorProducts(address)` - Get products owned by an actor

## 🔐 Security Features

- **Access Control**: Role-based permissions for different actors
- **State Validation**: Ensures proper state transitions
- **Ownership Verification**: Only owners can modify their products
- **Input Validation**: Comprehensive validation of all inputs
- **Reentrancy Protection**: Safe handling of external calls

## 🚀 Deployment to Public Networks

### Testnet Deployment (Goerli)

1. Get testnet ETH from [Goerli faucet](https://goerlifaucet.com/)
2. Update `.env` with your Infura project ID and mnemonic
3. Deploy using:
   ```bash
   truffle migrate --network goerli
   ```

### Mainnet Deployment

⚠️ **Warning**: Mainnet deployment requires real ETH for gas fees

```bash
truffle migrate --network mainnet
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Ensure MetaMask is connected to the correct network (Ganache)
   - Check that the RPC URL is `http://127.0.0.1:7545`

2. **Contract Interaction Errors**
   - Verify the contract address is correctly set in the frontend
   - Ensure Ganache is running and contracts are deployed

3. **Gas Estimation Failed**
   - Check that you have sufficient ETH in your account
   - Verify the contract function parameters are correct

4. **Transaction Reverted**
   - Check the contract requirements (e.g., only farmers can create products)
   - Ensure proper state transitions (e.g., can't skip states)

### Getting Help

- Check the [Issues](https://github.com/RADIAN1308/grootProject/issues) page
- Review the test files for usage examples
- Ensure all prerequisites are properly installed

## 🎯 Future Enhancements

- **IoT Integration**: Connect with IoT sensors for automatic data collection
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Supply chain analytics and reporting
- **Multi-Token Support**: Support for different cryptocurrencies
- **Batch Operations**: Process multiple products simultaneously
- **API Integration**: RESTful API for third-party integrations

---

**Happy farming and transparent supply chains! 🌱📦🚚🏪**