const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Web3 setup for Ganache blockchain
const web3 = new Web3('http://127.0.0.1:7545');

// Load smart contract
let contract = null;
let contractAddress = null;

function loadContract() {
    try {
        const contractPath = path.join(__dirname, '../../build/contracts/SupplyChain.json');
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const contractABI = contractJSON.abi;
        
        // Get deployed contract address from networks
        const networkId = '5777'; // Ganache network ID
        if (contractJSON.networks && contractJSON.networks[networkId]) {
            contractAddress = contractJSON.networks[networkId].address;
            contract = new web3.eth.Contract(contractABI, contractAddress);
            console.log('✅ Contract loaded:', contractAddress);
            return true;
        } else {
            console.log('⚠️  Contract not deployed on network 5777');
            return false;
        }
    } catch (error) {
        console.log('⚠️  Could not load contract:', error.message);
        return false;
    }
}

// Try to load contract on startup
loadContract();

// Storage for sensor data
let sensorReadings = {};
let productEnvironmentalData = {};
let deviceStatus = {};

// ESP32 sensor data endpoint
app.post('/api/sensor-data', async (req, res) => {
    try {
        const { 
            deviceId, 
            productId, 
            location, 
            temperature, 
            humidity, 
            quality, 
            timestamp, 
            sensorType,
            rssi 
        } = req.body;
        
        console.log('🌡️  =======================================');
        console.log('📡 ESP32 DHT11 Data Received:');
        console.log(`   📦 Product ID: ${productId}`);
        console.log(`   🏷️  Device: ${deviceId}`);
        console.log(`   📍 Location: ${location}`);
        console.log(`   🌡️  Temperature: ${temperature}°C`);
        console.log(`   💧 Humidity: ${humidity}%`);
        console.log(`   📊 Quality: ${quality}`);
        console.log(`   🔬 Sensor: ${sensorType || 'DHT11'}`);
        if (rssi) console.log(`   📶 Signal: ${rssi} dBm`);
        console.log('🌡️  =======================================');
        
        const now = new Date();
        
        // Store latest reading per device
        sensorReadings[deviceId] = {
            deviceId,
            productId,
            location,
            temperature,
            humidity,
            quality,
            timestamp: now,
            sensorType: sensorType || 'DHT11',
            rssi,
            status: 'online',
            lastSeen: now
        };
        
        // Update device status
        deviceStatus[deviceId] = {
            deviceId,
            location,
            status: 'online',
            lastSeen: now,
            signalStrength: rssi
        };
        
        // Store product-specific environmental data
        if (!productEnvironmentalData[productId]) {
            productEnvironmentalData[productId] = [];
        }
        
        const environmentalEntry = {
            temperature,
            humidity,
            quality,
            location,
            deviceId,
            timestamp: now,
            blockchainTimestamp: Date.now(),
            sensorType: sensorType || 'DHT11'
        };
        
        productEnvironmentalData[productId].push(environmentalEntry);
        
        // Keep only last 100 readings per product
        if (productEnvironmentalData[productId].length > 100) {
            productEnvironmentalData[productId] = productEnvironmentalData[productId].slice(-100);
        }
        
        console.log(`📊 Total readings for Product #${productId}: ${productEnvironmentalData[productId].length}`);
        
        // Send success response
        res.json({ 
            success: true, 
            message: 'Sensor data received and stored successfully',
            deviceId: deviceId,
            productId: productId,
            timestamp: now.toISOString(),
            readingsStored: productEnvironmentalData[productId].length
        });
        
        console.log('✅ Data stored successfully');
        console.log();
        
    } catch (error) {
        console.error('❌ Error processing sensor data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to process sensor data',
            message: error.message 
        });
    }
});

// Get environmental data for a specific product
app.get('/api/product/:productId/environmental', (req, res) => {
    try {
        const { productId } = req.params;
        const data = productEnvironmentalData[productId] || [];
        
        const currentReading = data.length > 0 ? data[data.length - 1] : null;
        
        res.json({
            success: true,
            productId: parseInt(productId),
            environmentalData: data,
            currentReading: currentReading,
            totalReadings: data.length,
            firstReading: data.length > 0 ? data[0].timestamp : null,
            lastReading: currentReading ? currentReading.timestamp : null
        });
        
        console.log(`📊 Retrieved ${data.length} readings for Product #${productId}`);
    } catch (error) {
        console.error('❌ Error retrieving product data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve product data' 
        });
    }
});

// Get latest reading from a specific device
app.get('/api/device/:deviceId', (req, res) => {
    try {
        const { deviceId } = req.params;
        const reading = sensorReadings[deviceId];
        
        if (reading) {
            res.json({
                success: true,
                ...reading
            });
        } else {
            res.status(404).json({ 
                success: false,
                error: 'Device not found',
                deviceId: deviceId
            });
        }
    } catch (error) {
        console.error('❌ Error retrieving device data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve device data' 
        });
    }
});

// Get all connected devices
app.get('/api/devices', (req, res) => {
    try {
        const devices = Object.values(sensorReadings).map(reading => {
            const minutesSinceLastSeen = (new Date() - new Date(reading.lastSeen)) / 1000 / 60;
            return {
                ...reading,
                status: minutesSinceLastSeen < 2 ? 'online' : 'offline'
            };
        });
        
        res.json({
            success: true,
            devices: devices,
            totalDevices: devices.length,
            onlineDevices: devices.filter(d => d.status === 'online').length
        });
    } catch (error) {
        console.error('❌ Error retrieving devices:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve devices' 
        });
    }
});

// Get all products with environmental data
app.get('/api/environmental-overview', (req, res) => {
    try {
        const overview = Object.keys(productEnvironmentalData).map(productId => {
            const data = productEnvironmentalData[productId];
            const latest = data[data.length - 1];
            
            return {
                productId: parseInt(productId),
                latestReading: latest,
                totalReadings: data.length,
                lastUpdate: latest ? latest.timestamp : null,
                devices: [...new Set(data.map(d => d.deviceId))],
                locations: [...new Set(data.map(d => d.location))]
            };
        });
        
        res.json({
            success: true,
            products: overview,
            totalProducts: overview.length
        });
    } catch (error) {
        console.error('❌ Error retrieving overview:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve overview' 
        });
    }
});

// Get statistics
app.get('/api/statistics', (req, res) => {
    try {
        const totalProducts = Object.keys(productEnvironmentalData).length;
        const totalDevices = Object.keys(sensorReadings).length;
        const totalReadings = Object.values(productEnvironmentalData)
            .reduce((sum, data) => sum + data.length, 0);
        
        const activeDevices = Object.values(sensorReadings).filter(reading => {
            const minutesSinceLastSeen = (new Date() - new Date(reading.lastSeen)) / 1000 / 60;
            return minutesSinceLastSeen < 2;
        }).length;
        
        res.json({
            success: true,
            statistics: {
                totalProducts,
                totalDevices,
                activeDevices,
                totalReadings,
                uptime: process.uptime(),
                serverStarted: new Date(Date.now() - process.uptime() * 1000)
            }
        });
    } catch (error) {
        console.error('❌ Error retrieving statistics:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve statistics' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        timestamp: new Date(),
        ganache: web3.currentProvider.connected ? 'connected' : 'disconnected',
        contract: contractAddress || 'not loaded'
    });
});

// Clean up old device statuses (devices offline for more than 5 minutes)
setInterval(() => {
    const now = new Date();
    Object.keys(deviceStatus).forEach(deviceId => {
        const minutesSinceLastSeen = (now - new Date(deviceStatus[deviceId].lastSeen)) / 1000 / 60;
        if (minutesSinceLastSeen > 5) {
            deviceStatus[deviceId].status = 'offline';
        }
    });
}, 60000); // Check every minute

// Start server
app.listen(PORT, () => {
    console.log('🌐 =======================================');
    console.log('🌐 IoT Blockchain Server Started');
    console.log('🌐 =======================================');
    console.log(`📡 Server running on port: ${PORT}`);
    console.log(`🔗 ESP32 endpoint: http://localhost:${PORT}/api/sensor-data`);
    console.log(`📊 API endpoints available:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/devices`);
    console.log(`   GET  /api/device/:deviceId`);
    console.log(`   GET  /api/product/:productId/environmental`);
    console.log(`   GET  /api/environmental-overview`);
    console.log(`   GET  /api/statistics`);
    console.log(`   POST /api/sensor-data`);
    console.log(`🔗 Connected to Ganache: http://127.0.0.1:7545`);
    if (contractAddress) {
        console.log(`📋 Contract Address: ${contractAddress}`);
    } else {
        console.log(`⚠️  Smart contract not loaded (will work without blockchain)`);
    }
    console.log('🌐 =======================================');
    console.log();
    console.log('💡 Tips:');
    console.log('   • Make sure Ganache is running on port 7545');
    console.log('   • Update ESP32 code with your WiFi credentials');
    console.log('   • Update ESP32 code with this server URL');
    console.log('   • Start React app to view sensor data');
    console.log();
});
