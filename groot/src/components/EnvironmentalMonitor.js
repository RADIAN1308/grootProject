import React, { useState, useEffect } from 'react';

const EnvironmentalMonitor = ({ productId = null }) => {
    const [environmentalData, setEnvironmentalData] = useState([]);
    const [currentReading, setCurrentReading] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(productId || 1);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');

    useEffect(() => {
        checkServerHealth();
        if (selectedProduct) {
            loadProductEnvironmentalData();
        }
        loadAllProductsOverview();
        loadDevices();
        
        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            checkServerHealth();
            if (selectedProduct) {
                loadProductEnvironmentalData();
            }
            loadAllProductsOverview();
            loadDevices();
        }, 10000);
        
        return () => clearInterval(interval);
    }, [selectedProduct]);

    const checkServerHealth = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/health');
            const data = await response.json();
            setServerStatus(data.success ? 'online' : 'offline');
        } catch (error) {
            setServerStatus('offline');
        }
    };

    const loadProductEnvironmentalData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/product/${selectedProduct}/environmental`);
            const data = await response.json();
            
            if (data.success) {
                setEnvironmentalData(data.environmentalData || []);
                setCurrentReading(data.currentReading);
                setLastUpdate(new Date());
                console.log(`📊 Loaded environmental data for product #${selectedProduct}:`, data);
            } else {
                setError('Failed to load environmental data');
            }
        } catch (error) {
            console.error('Failed to load environmental data:', error);
            setError('Server connection failed. Make sure IoT server is running.');
        } finally {
            setLoading(false);
        }
    };

    const loadAllProductsOverview = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/environmental-overview');
            const data = await response.json();
            if (data.success) {
                setAllProducts(data.products || []);
            }
        } catch (error) {
            console.error('Failed to load products overview:', error);
        }
    };

    const loadDevices = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/devices');
            const data = await response.json();
            if (data.success) {
                setDevices(data.devices || []);
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
        }
    };

    const getQualityColor = (quality) => {
        switch(quality?.toUpperCase()) {
            case 'OPTIMAL': return 'quality-optimal';
            case 'WARNING': return 'quality-warning';
            case 'CRITICAL': return 'quality-critical';
            default: return 'quality-optimal';
        }
    };

    const getTempColor = (temp, quality) => {
        switch(quality?.toUpperCase()) {
            case 'OPTIMAL': return 'temp-optimal';
            case 'WARNING': return 'temp-warning';
            case 'CRITICAL': return 'temp-critical';
            default: return 'temp-optimal';
        }
    };

    const getHumidityColor = (humidity, quality) => {
        switch(quality?.toUpperCase()) {
            case 'OPTIMAL': return 'humidity-optimal';
            case 'WARNING': return 'humidity-warning';
            case 'CRITICAL': return 'humidity-critical';
            default: return 'humidity-optimal';
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="environmental-monitor">
            {/* Server Status Banner */}
            {serverStatus === 'offline' && (
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #f5c6cb'
                }}>
                    <strong>⚠️ IoT Server Offline</strong>
                    <p style={{margin: '0.5rem 0 0 0', fontSize: '0.9rem'}}>
                        Please start the IoT server: <code>node groot/server/iot-blockchain-server.js</code>
                    </p>
                </div>
            )}

            {/* Connected Devices Status */}
            {devices.length > 0 && (
                <div className="iot-section">
                    <h3>📡 Connected ESP32 Devices</h3>
                    <div className="device-list" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1rem'
                    }}>
                        {devices.map(device => (
                            <div key={device.deviceId} style={{
                                background: 'white',
                                border: `2px solid ${device.status === 'online' ? '#4caf50' : '#ccc'}`,
                                borderRadius: '8px',
                                padding: '1rem'
                            }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                                    <strong>📡 {device.deviceId}</strong>
                                    <span className={`quality-status ${device.status === 'online' ? 'quality-optimal' : 'quality-warning'}`}>
                                        {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                                    </span>
                                </div>
                                <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                                    <div>📍 {device.location}</div>
                                    <div>📦 Product #{device.productId}</div>
                                    <div>🌡️ {device.temperature?.toFixed(1)}°C | 💧 {device.humidity?.toFixed(1)}%</div>
                                    <div>🕐 {formatTimestamp(device.lastSeen)}</div>
                                    {device.rssi && <div>📶 Signal: {device.rssi} dBm</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Product Selection */}
            <div className="iot-section">
                <h3>📦 Select Product for Environmental Monitoring</h3>
                <div className="form-group">
                    <label htmlFor="productSelect">Product ID:</label>
                    <select 
                        id="productSelect"
                        className="form-control"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(parseInt(e.target.value))}
                        style={{maxWidth: '200px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd'}}
                    >
                        <option value="">Select a product</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(id => (
                            <option key={id} value={id}>Product #{id}</option>
                        ))}
                    </select>
                </div>
                
                {lastUpdate && (
                    <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem'}}>
                        🕐 Last updated: {lastUpdate.toLocaleTimeString()}
                        {loading && <span> (Updating...)</span>}
                    </p>
                )}

                {error && (
                    <p style={{color: '#f44336', marginTop: '1rem'}}>
                        ⚠️ {error}
                    </p>
                )}
            </div>

            {/* Current Environmental Reading */}
            {currentReading && (
                <div className="iot-section">
                    <h3>🌡️ Current Environmental Conditions - Product #{selectedProduct}</h3>
                    <div className="environmental-grid">
                        {/* Temperature Card */}
                        <div className="environmental-card">
                            <div className="sensor-header">
                                <div className="sensor-icon">🌡️</div>
                                <div className={`quality-status ${getQualityColor(currentReading.quality)}`}>
                                    {currentReading.quality || 'UNKNOWN'}
                                </div>
                            </div>
                            <div className={`sensor-value ${getTempColor(currentReading.temperature, currentReading.quality)}`}>
                                {currentReading.temperature?.toFixed(1) || '--'}
                                <span className="sensor-unit">°C</span>
                            </div>
                            <div className="sensor-details">
                                <span>Optimal: 5-22°C</span>
                                <span>{new Date(currentReading.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="device-info">
                                📡 {currentReading.deviceId} | 📍 {currentReading.location}
                            </div>
                        </div>

                        {/* Humidity Card */}
                        <div className="environmental-card">
                            <div className="sensor-header">
                                <div className="sensor-icon">💧</div>
                                <div className={`quality-status ${getQualityColor(currentReading.quality)}`}>
                                    {currentReading.quality || 'UNKNOWN'}
                                </div>
                            </div>
                            <div className={`sensor-value ${getHumidityColor(currentReading.humidity, currentReading.quality)}`}>
                                {currentReading.humidity?.toFixed(1) || '--'}
                                <span className="sensor-unit">%</span>
                            </div>
                            <div className="sensor-details">
                                <span>Optimal: 35-65%</span>
                                <span>{new Date(currentReading.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="device-info">
                                📡 {currentReading.deviceId} | 📍 {currentReading.location}
                            </div>
                        </div>
                    </div>

                    {/* Quality Summary */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: currentReading.quality === 'OPTIMAL' ? '#d4edda' : 
                                   currentReading.quality === 'WARNING' ? '#fff3cd' : '#f8d7da',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem'}}>
                            {currentReading.quality === 'OPTIMAL' && '✅ Environmental Conditions are OPTIMAL'}
                            {currentReading.quality === 'WARNING' && '⚠️ Environmental Conditions Need Attention'}
                            {currentReading.quality === 'CRITICAL' && '🚨 CRITICAL: Immediate Action Required'}
                        </div>
                        <div style={{fontSize: '0.9rem'}}>
                            Product #{selectedProduct} is being monitored by {currentReading.sensorType || 'DHT11'} sensor
                        </div>
                    </div>
                </div>
            )}

            {/* Environmental History */}
            {environmentalData.length > 0 && (
                <div className="iot-section">
                    <h3>📊 Environmental History - Product #{selectedProduct}</h3>
                    <p style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>
                        Showing last {Math.min(environmentalData.length, 20)} of {environmentalData.length} total readings
                    </p>
                    <div className="iot-timeline" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {environmentalData.slice(-20).reverse().map((reading, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                margin: '0.5rem 0',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${
                                    reading.quality === 'OPTIMAL' ? '#4caf50' :
                                    reading.quality === 'WARNING' ? '#ff9800' : '#f44336'
                                }`
                            }}>
                                <div style={{flex: 1}}>
                                    <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>
                                        🌡️ {reading.temperature?.toFixed(1)}°C | 💧 {reading.humidity?.toFixed(1)}%
                                    </div>
                                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                        📍 {reading.location} | 📡 {reading.deviceId} | 🔬 {reading.sensorType}
                                    </div>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <div className={`quality-status ${getQualityColor(reading.quality)}`} style={{marginBottom: '0.25rem'}}>
                                        {reading.quality}
                                    </div>
                                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                        {formatTimestamp(reading.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Products Overview */}
            {allProducts.length > 0 && (
                <div className="iot-section">
                    <h3>🏭 All Products Environmental Overview</h3>
                    <div className="environmental-grid">
                        {allProducts.map(product => (
                            <div key={product.productId} className="environmental-card">
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                    <h4 style={{margin: 0}}>📦 Product #{product.productId}</h4>
                                    {product.latestReading && (
                                        <div className={`quality-status ${getQualityColor(product.latestReading.quality)}`}>
                                            {product.latestReading.quality}
                                        </div>
                                    )}
                                </div>
                                {product.latestReading ? (
                                    <div>
                                        <div style={{fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem'}}>
                                            🌡️ {product.latestReading.temperature?.toFixed(1)}°C | 💧 {product.latestReading.humidity?.toFixed(1)}%
                                        </div>
                                        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                            <div>📍 {product.latestReading.location}</div>
                                            <div>📡 {product.devices?.join(', ')}</div>
                                            <div>📊 {product.totalReadings} readings</div>
                                            <div>🕐 {formatTimestamp(product.lastUpdate)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{color: 'var(--text-secondary)'}}>
                                        No environmental data available
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Data State */}
            {!loading && (!currentReading && environmentalData.length === 0 && allProducts.length === 0) && (
                <div className="iot-section" style={{textAlign: 'center', padding: '3rem'}}>
                    <h3>📡 Waiting for ESP32 DHT11 Data</h3>
                    <p style={{color: 'var(--text-secondary)', margin: '1rem 0'}}>
                        Make sure your ESP32 is connected and sending data.
                    </p>
                    <div style={{
                        background: '#f8f9fa', 
                        padding: '1.5rem', 
                        borderRadius: '8px', 
                        marginTop: '1rem',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                        maxWidth: '600px',
                        margin: '1rem auto'
                    }}>
                        <strong>✅ Setup Checklist:</strong><br/><br/>
                        
                        <strong>1. Hardware:</strong><br/>
                        • DHT11 Data → ESP32 GPIO 4<br/>
                        • DHT11 VCC → 3.3V<br/>
                        • DHT11 GND → GND<br/><br/>
                        
                        <strong>2. Software:</strong><br/>
                        • Upload esp32/dht11_blockchain_sensor.ino<br/>
                        • Update WiFi credentials in code<br/>
                        • Update server URL with your computer's IP<br/><br/>
                        
                        <strong>3. Server:</strong><br/>
                        • Run: <code>node groot/server/iot-blockchain-server.js</code><br/>
                        • Server should be running on port 3001<br/><br/>
                        
                        <strong>4. ESP32 Commands:</strong><br/>
                        • Serial Monitor: <code>PRODUCT:1</code> - Monitor Product #1<br/>
                        • Serial Monitor: <code>STATUS</code> - Show configuration<br/>
                        • Serial Monitor: <code>TEST</code> - Take immediate reading
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnvironmentalMonitor;
