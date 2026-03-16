const mqtt = require('mqtt');
const mongoose = require('mongoose');
const express = require('express'); 

// --- 1. Keep-Awake Web Server (For Render) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Smart Garden IIoT Backend is Awake and Listening!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// --- 2. MongoDB Setup ---
// Note: Ensure the 'smartgarden' database name matches your Atlas case exactly
const MONGO_URL = "mongodb+srv://Muaad:Muaad123@cluster0.crs1u2z.mongodb.net/smartgarden?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URL)
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const sensorSchema = new mongoose.Schema({
  timestamp: String,
  moisture_percent: Number,
  soil_temp_c: Number,
  air_temp_c: Number,
  humidity_percent: Number,
  pressure_hpa: Number,
  light_lux: Number
});

const SensorData = mongoose.model('SensorData', sensorSchema);

// --- 3. HiveMQ Setup ---
const MQTT_BROKER = "mqtts://beee214b0e8043ff8843cc7ddb1badc3.s1.eu.hivemq.cloud:8883";
const MQTT_OPTIONS = {
  username: 'Muaad',
  password: 'Muaad123',
  clientId: 'node_backend_' + Math.random().toString(16).substring(2, 8)
};

const mqttClient = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);

mqttClient.on('connect', () => {
  console.log('Connected to HiveMQ Broker!');
  mqttClient.subscribe('smartgarden/sensors', (err) => {
    if (!err) console.log('Subscribed to MQTT topic: smartgarden/sensors');
  });
});

// --- 4. The Bridge (Listen, Display & Save) ---
mqttClient.on('message', async (topic, message) => {
  console.log(`\n--- New message received on topic [${topic}] ---`);
  
  // Convert the buffer message to a readable string
  const payloadString = message.toString();
  
  // THIS IS THE LINE YOU WANTED: Display the actual data in the terminal
  console.log('Incoming Data:', payloadString);

  try {
    const jsonData = JSON.parse(payloadString);
    const newReading = new SensorData(jsonData);
    await newReading.save();
    console.log('SUCCESS: Data permanently saved to MongoDB!');
  } catch (error) {
    console.error('Error parsing or saving data:', error);
  }
});
