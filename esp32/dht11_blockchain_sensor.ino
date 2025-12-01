/*
 * Farm Supply Chain - ESP32 DHT11 Sensor Integration
 * Reads temperature and humidity data and sends to blockchain backend
 * 
 * Hardware:
 * - ESP32 DevKit V1
 * - DHT11 Temperature & Humidity Sensor
 * - Connect DHT11 Data pin to GPIO 4
 * - Connect DHT11 VCC to 3.3V
 * - Connect DHT11 GND to GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// DHT11 Configuration
#define DHTPIN 4        // DHT11 data pin connected to GPIO 4
#define DHTTYPE DHT11   // DHT 11 sensor type
DHT dht(DHTPIN, DHTTYPE);

// WiFi credentials - CHANGE THESE!
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL - Change to your computer's IP address
// Find your IP with: ipconfig (Windows) or ifconfig (Linux/Mac)
const char* serverURL = "http://192.168.1.100:3001/api/sensor-data";

// Device configuration
const char* deviceID = "ESP32_DHT11_001";
const char* location = "Farm Storage Room A";
int productID = 1;  // Default product ID to monitor

// Timing
unsigned long previousMillis = 0;
const long interval = 10000; // Send data every 10 seconds

// LED indicator (built-in LED)
#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println();
  Serial.println("================================");
  Serial.println("🌡️  Farm Supply Chain IoT Sensor");
  Serial.println("🔬 DHT11 Temperature & Humidity Monitor");
  Serial.println("================================");
  
  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize DHT11 sensor
  Serial.println("📡 Initializing DHT11 sensor...");
  dht.begin();
  delay(2000); // Give sensor time to initialize
  Serial.println("✅ DHT11 sensor initialized");
  
  // Connect to WiFi
  Serial.println();
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 30) {
    delay(1000);
    Serial.print(".");
    wifiAttempts++;
    
    // Blink LED while connecting
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println();
    Serial.println("✅ WiFi Connected!");
    Serial.print("📡 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("🏠 Location: ");
    Serial.println(location);
    Serial.print("📦 Monitoring Product ID: ");
    Serial.println(productID);
    Serial.print("🔗 Server: ");
    Serial.println(serverURL);
    Serial.println("================================");
    Serial.println();
    Serial.println("📝 Serial Commands:");
    Serial.println("   PRODUCT:X - Set product ID to monitor (e.g., PRODUCT:2)");
    Serial.println("   LOCATION:Name - Set location (e.g., LOCATION:Storage Room B)");
    Serial.println("   STATUS - Show current configuration");
    Serial.println("   TEST - Take immediate reading");
    Serial.println("================================");
    Serial.println();
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println();
    Serial.println("❌ WiFi connection failed!");
    Serial.println("⚠️  Please check your credentials and restart");
  }
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Periodic sensor reading
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    readAndSendData();
  }
  
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readString();
    command.trim();
    handleSerialCommand(command);
  }
  
  // Keep WiFi alive
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, LOW);
    Serial.println("⚠️  WiFi disconnected! Reconnecting...");
    WiFi.reconnect();
  }
  
  delay(100);
}

void handleSerialCommand(String command) {
  Serial.println();
  Serial.println("📨 Command received: " + command);
  
  if (command.startsWith("PRODUCT:")) {
    int newProductID = command.substring(8).toInt();
    if (newProductID > 0) {
      productID = newProductID;
      Serial.println("✅ Product ID changed to: " + String(productID));
      Serial.println("📦 Now monitoring Product #" + String(productID));
    } else {
      Serial.println("❌ Invalid product ID");
    }
  }
  else if (command.startsWith("LOCATION:")) {
    String newLocation = command.substring(9);
    if (newLocation.length() > 0) {
      location = newLocation.c_str();
      Serial.println("✅ Location changed to: " + String(location));
    } else {
      Serial.println("❌ Invalid location");
    }
  }
  else if (command == "STATUS") {
    showStatus();
  }
  else if (command == "TEST") {
    Serial.println("🔬 Taking immediate reading...");
    readAndSendData();
  }
  else {
    Serial.println("❌ Unknown command");
    Serial.println("Available commands: PRODUCT:X, LOCATION:Name, STATUS, TEST");
  }
  
  Serial.println();
}

void showStatus() {
  Serial.println("================================");
  Serial.println("📊 CURRENT CONFIGURATION");
  Serial.println("================================");
  Serial.print("📡 Device ID: ");
  Serial.println(deviceID);
  Serial.print("📦 Product ID: ");
  Serial.println(productID);
  Serial.print("📍 Location: ");
  Serial.println(location);
  Serial.print("📶 WiFi Status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "✅ Connected" : "❌ Disconnected");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("🌐 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("📡 Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  }
  Serial.print("🔗 Server: ");
  Serial.println(serverURL);
  Serial.println("================================");
}

void readAndSendData() {
  // Blink LED to show reading
  digitalWrite(LED_PIN, LOW);
  delay(100);
  digitalWrite(LED_PIN, HIGH);
  
  Serial.println("📊 ================================");
  Serial.println("🔬 Reading DHT11 sensor...");
  
  // Read temperature and humidity
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Check if readings are valid
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("❌ Failed to read from DHT11 sensor!");
    Serial.println("⚠️  Check connections:");
    Serial.println("   - DHT11 Data -> GPIO 4");
    Serial.println("   - DHT11 VCC -> 3.3V");
    Serial.println("   - DHT11 GND -> GND");
    Serial.println("📊 ================================");
    return;
  }
  
  // Display readings
  Serial.println("✅ Sensor read successful!");
  Serial.println();
  Serial.println("📦 Product ID: " + String(productID));
  Serial.println("🌡️  Temperature: " + String(temperature, 1) + "°C");
  Serial.println("💧 Humidity: " + String(humidity, 1) + "%");
  Serial.println("📍 Location: " + String(location));
  
  // Determine quality status
  String quality = getQualityStatus(temperature, humidity);
  Serial.println("📈 Quality Status: " + quality);
  
  if (quality == "CRITICAL") {
    Serial.println("🚨 ALERT: Environmental conditions are CRITICAL!");
  } else if (quality == "WARNING") {
    Serial.println("⚠️  WARNING: Environmental conditions need attention");
  } else {
    Serial.println("✅ Environmental conditions are OPTIMAL");
  }
  
  // Send to blockchain server
  if (WiFi.status() == WL_CONNECTED) {
    sendToBlockchainServer(temperature, humidity, quality);
  } else {
    Serial.println("❌ Cannot send data - WiFi not connected");
  }
  
  Serial.println("📊 ================================");
  Serial.println();
}

String getQualityStatus(float temp, float humidity) {
  // Define optimal ranges for farm products
  // Temperature: 5-22°C is optimal, 2-25°C is acceptable
  // Humidity: 35-65% is optimal, 30-70% is acceptable
  
  if (temp < 2 || temp > 25 || humidity < 30 || humidity > 70) {
    return "CRITICAL";
  } else if (temp < 5 || temp > 22 || humidity < 35 || humidity > 65) {
    return "WARNING";  
  } else {
    return "OPTIMAL";
  }
}

void sendToBlockchainServer(float temp, float humidity, String quality) {
  HTTPClient http;
  
  Serial.println("📤 Sending data to blockchain server...");
  Serial.println("🔗 URL: " + String(serverURL));
  
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout
  
  // Create JSON payload manually (no ArduinoJson needed)
  String jsonString = "{";
  jsonString += "\"deviceId\":\"" + String(deviceID) + "\",";
  jsonString += "\"productId\":" + String(productID) + ",";
  jsonString += "\"location\":\"" + String(location) + "\",";
  jsonString += "\"temperature\":" + String(temp, 1) + ",";
  jsonString += "\"humidity\":" + String(humidity, 1) + ",";
  jsonString += "\"quality\":\"" + quality + "\",";
  jsonString += "\"timestamp\":" + String(millis()) + ",";
  jsonString += "\"sensorType\":\"DHT11\",";
  jsonString += "\"rssi\":" + String(WiFi.RSSI());
  jsonString += "}";
  
  Serial.println("📄 JSON Payload:");
  Serial.println(jsonString);
  Serial.println();
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("📨 Server Response:");
    Serial.println("   Status Code: " + String(httpResponseCode));
    Serial.println("   Response: " + response);
    
    if (httpResponseCode == 200) {
      Serial.println("✅ Data sent successfully to blockchain!");
      // Flash LED to confirm success
      for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, LOW);
        delay(100);
        digitalWrite(LED_PIN, HIGH);
        delay(100);
      }
    } else {
      Serial.println("⚠️  Server returned non-200 status code");
    }
  } else {
    Serial.println("❌ Error sending data!");
    Serial.println("   Error code: " + String(httpResponseCode));
    Serial.println("   Check:");
    Serial.println("   1. Server is running (node server/iot-blockchain-server.js)");
    Serial.println("   2. Server URL is correct: " + String(serverURL));
    Serial.println("   3. Your computer's firewall allows connections");
  }
  
  http.end();
}
