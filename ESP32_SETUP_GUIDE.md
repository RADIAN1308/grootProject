# ESP32 DHT11 IoT Integration - Complete Setup Guide

## 🎯 Overview

This guide will help you integrate ESP32 DHT11 temperature and humidity sensors with your blockchain supply chain application.

## 📋 Hardware Requirements

- **ESP32 DevKit V1** (or compatible)
- **DHT11 Temperature & Humidity Sensor**
- **Jumper Wires** (3 wires needed)
- **USB Cable** for programming ESP32
- **Power Supply** (USB or external 5V)

## 🔌 Hardware Connections

```
DHT11 Sensor → ESP32 DevKit V1
─────────────────────────────
VCC (Pin 1)  → 3.3V
DATA (Pin 2) → GPIO 4
NC (Pin 3)   → Not Connected
GND (Pin 4)  → GND
```

**Note:** Some DHT11 modules have built-in pull-up resistors. If yours doesn't, add a 10kΩ resistor between VCC and DATA pins.

## 💻 Software Requirements

### Arduino IDE Setup

1. **Install Arduino IDE**
   - Download from: https://www.arduino.cc/en/software
   - Install version 2.0 or higher

2. **Install ESP32 Board Support**
   - Open Arduino IDE
   - Go to: File → Preferences
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Go to: Tools → Board → Boards Manager
   - Search for "ESP32"
   - Install "esp32 by Espressif Systems"

3. **Install Required Libraries**
   - Go to: Tools → Manage Libraries
   - Install the following libraries:
     - **DHT sensor library** by Adafruit
     - **Adafruit Unified Sensor** by Adafruit
     - **ArduinoJson** by Benoit Blanchon (version 6.x)

### Node.js Backend Setup

1. **Install Dependencies**
   ```bash
   cd groot
   npm install express cors web3
   ```

2. **Check Your Computer's IP Address**
   - **Windows**: Open CMD and run `ipconfig`
   - **Mac/Linux**: Open Terminal and run `ifconfig`
   - Note your local IP address (usually 192.168.x.x)

## 🚀 Step-by-Step Setup

### Step 1: Prepare ESP32 Code

1. Open `esp32/dht11_blockchain_sensor.ino` in Arduino IDE

2. Update WiFi credentials (lines 18-19):
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";        // Your WiFi name
   const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password
   ```

3. Update server URL (line 22) with your computer's IP:
   ```cpp
   const char* serverURL = "http://192.168.1.100:3001/api/sensor-data";
   //                              ^^^^^^^^^^^^^^
   //                              Replace with YOUR computer's IP
   ```

4. Optional: Update device configuration (lines 25-27):
   ```cpp
   const char* deviceID = "ESP32_DHT11_001";
   const char* location = "Farm Storage Room A";
   int productID = 1;  // Default product to monitor
   ```

### Step 2: Upload to ESP32

1. Connect ESP32 to computer via USB

2. In Arduino IDE:
   - Select Board: Tools → Board → ESP32 Arduino → ESP32 Dev Module
   - Select Port: Tools → Port → (Select your ESP32's COM port)
   - Click Upload button (→)

3. Wait for upload to complete

4. Open Serial Monitor (Tools → Serial Monitor)
   - Set baud rate to 115200
   - You should see connection messages

### Step 3: Start Backend Server

1. Open terminal/command prompt

2. Navigate to project directory:
   ```bash
   cd "d:\Blockchain\grootProject\grootProject\groot"
   ```

3. Start the IoT server:
   ```bash
   node server/iot-blockchain-server.js
   ```

4. You should see:
   ```
   🌐 =======================================
   🌐 IoT Blockchain Server Started
   🌐 =======================================
   📡 Server running on port: 3001
   🔗 ESP32 endpoint: http://localhost:3001/api/sensor-data
   ```

### Step 4: Start React Frontend

1. Open new terminal/command prompt

2. Navigate to groot directory:
   ```bash
   cd "d:\Blockchain\grootProject\grootProject\groot"
   ```

3. Start React app:
   ```bash
   npm start
   ```

4. Browser should open to http://localhost:3000

### Step 5: View Environmental Data

1. In the React app, click the "🌡️ Environmental" tab

2. Select a product ID from dropdown

3. You should see:
   - Connected ESP32 devices
   - Current temperature and humidity
   - Quality status (OPTIMAL/WARNING/CRITICAL)
   - Environmental history

## 📊 Using the System

### ESP32 Serial Commands

Open Serial Monitor in Arduino IDE and send these commands:

| Command | Description | Example |
|---------|-------------|---------|
| `PRODUCT:X` | Set product ID to monitor | `PRODUCT:2` |
| `LOCATION:Name` | Change location name | `LOCATION:Storage Room B` |
| `STATUS` | Show current configuration | `STATUS` |
| `TEST` | Take immediate reading | `TEST` |

### Data Flow

```
ESP32 DHT11 Sensor
        ↓
    WiFi Network
        ↓
IoT Blockchain Server (Port 3001)
        ↓
    React Frontend (Port 3000)
        ↓
   User Interface
```

### Quality Thresholds

The system automatically determines quality status:

**OPTIMAL** ✅
- Temperature: 5-22°C
- Humidity: 35-65%

**WARNING** ⚠️
- Temperature: 2-5°C or 22-25°C
- Humidity: 30-35% or 65-70%

**CRITICAL** 🚨
- Temperature: <2°C or >25°C
- Humidity: <30% or >70%

## 🔧 Troubleshooting

### ESP32 Not Connecting to WiFi

**Check:**
- WiFi credentials are correct (case-sensitive)
- ESP32 is within WiFi range
- WiFi is 2.4GHz (ESP32 doesn't support 5GHz)

**Solution:**
- Open Serial Monitor to see connection status
- Restart ESP32 by pressing RST button
- Check router settings for MAC address filtering

### "Server connection failed" in React App

**Check:**
- IoT server is running (`node server/iot-blockchain-server.js`)
- Server shows "Server running on port: 3001"
- No firewall blocking port 3001

**Solution:**
- Restart the IoT server
- Check Windows Firewall settings
- Try different port if 3001 is blocked

### ESP32 Can't Send Data to Server

**Check:**
- Server URL in ESP32 code matches your computer's IP
- Both ESP32 and computer are on same WiFi network
- Server is running and accessible

**Solution:**
- Find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update `serverURL` in ESP32 code
- Re-upload to ESP32
- Check Serial Monitor for error messages

### DHT11 Sensor Reads "NaN" or fails

**Check:**
- All 3 wires properly connected
- DHT11 powered with 3.3V (not 5V for this setup)
- Data pin connected to GPIO 4

**Solution:**
- Check connections with multimeter
- Try different DHT11 sensor
- Add 10kΩ pull-up resistor if needed
- Wait 2 seconds after powering on before reading

### No Data Showing in React App

**Check:**
- ESP32 shows "✅ Data sent successfully" in Serial Monitor
- IoT server shows "📡 ESP32 DHT11 Data Received"
- Product ID in ESP32 matches selected product in React app

**Solution:**
- Check all three components are running
- Verify network connectivity
- Check browser console (F12) for errors
- Send `TEST` command via Serial Monitor

## 🎮 Testing the Complete System

1. **Upload ESP32 Code**
   - Upload and open Serial Monitor
   - Confirm WiFi connection
   - Confirm sensor readings

2. **Start Backend**
   - Run IoT server
   - Confirm ESP32 connects
   - Check for data reception logs

3. **Start Frontend**
   - Run React app
   - Go to Environmental tab
   - Select product ID

4. **Monitor Data Flow**
   - ESP32 Serial Monitor: See readings
   - IoT Server Terminal: See data received
   - React App: See live updates every 10 seconds

5. **Test Commands**
   ```
   Serial Monitor:
   > PRODUCT:1    // Switch to Product #1
   > TEST         // Take reading now
   > STATUS       // Show configuration
   ```

## 📱 Production Deployment Tips

### For Multiple ESP32 Devices

1. Update device ID for each ESP32:
   ```cpp
   const char* deviceID = "ESP32_DHT11_002";  // Unique per device
   ```

2. Set different default products:
   ```cpp
   int productID = 2;  // Different product per sensor
   ```

3. Update locations:
   ```cpp
   const char* location = "Processing Plant A";
   ```

### For Remote Access

1. Use static IP for your computer
2. Configure port forwarding on router
3. Use HTTPS for production
4. Add authentication to API endpoints

### Power Management

For battery-powered ESP32:
- Enable deep sleep between readings
- Use lower sampling frequency
- Consider solar panel + battery setup

## 📚 API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sensor-data` | POST | ESP32 sends sensor data here |
| `/api/product/:id/environmental` | GET | Get environmental data for product |
| `/api/devices` | GET | List all connected devices |
| `/api/device/:id` | GET | Get specific device info |
| `/api/environmental-overview` | GET | Overview of all products |
| `/api/statistics` | GET | System statistics |
| `/api/health` | GET | Server health check |

## 🔐 Security Considerations

- Change default WiFi credentials
- Use environment variables for sensitive data
- Add API authentication for production
- Use HTTPS in production
- Implement rate limiting
- Validate all sensor data
- Log all API access

## ✨ Features

- ✅ Real-time temperature monitoring
- ✅ Real-time humidity monitoring
- ✅ Automatic quality assessment
- ✅ Multi-product support
- ✅ Multiple device support
- ✅ Historical data tracking
- ✅ Configurable alerts
- ✅ Serial command interface
- ✅ Responsive UI
- ✅ Blockchain integration ready

## 🎓 Next Steps

1. Test basic functionality with one ESP32
2. Add more ESP32 devices for different products
3. Integrate with blockchain smart contract
4. Add alert notifications
5. Create mobile app for monitoring
6. Add data visualization charts
7. Implement predictive analytics

## 📞 Support

If you encounter issues:
1. Check Serial Monitor for ESP32 errors
2. Check IoT server terminal for connection logs
3. Check React app console (F12) for errors
4. Verify all connections and configurations
5. Try the troubleshooting section above

Your ESP32 DHT11 IoT system is now ready to monitor environmental conditions for your blockchain supply chain! 🌡️📊✨
