// src/contexts/PlantContext.jsx

import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import mqtt from 'mqtt';
import { authService } from '@/services/authService'; // Assuming this path is correct
import { useAuth } from '@/contexts/authContext';

import {
    faDroplet, faLightbulb, faSeedling, faTemperatureHalf,

    faSun, faCloud, faSmog, faCloudRain, faCloudShowersHeavy,
    faCloudShowersWater, faSnowflake, faCloudBolt,

    faSpinner
} from '@fortawesome/free-solid-svg-icons';

// --- 1. Define the Context ---
const PlantContext = createContext(null);

// --- 2. Custom Hook to consume the Context ---
export const usePlantContext = () => {
    const context = useContext(PlantContext);
    if (!context) {
        throw new Error('usePlantContext must be used within a PlantProvider');
    }
    return context;
};

// --- Sensor Data Mappers (Keep these in the context for centralized access) ---
export const SoilMoistureThreshold = [
    { min: 81, text: 'Flooded', dangerousLevel: 3 }, // High risk of root rot
    { min: 71, text: 'Very Humid', dangerousLevel: 2 }, // Soil is saturated, caution needed
    { min: 51, text: 'Humid', dangerousLevel: 1 }, // Good moisture, slight risk of fungus
    { min: 31, text: 'Comfortable', dangerousLevel: 0 }, // Optimal growing range
    { min: 11, text: 'Very Dry', dangerousLevel: 2 }, // Approaching wilting point
    { min: 0, text: 'Extremely Arid', dangerousLevel: 3 }, // Severe drought stress
];

export const TemperatureThreshold = [
    { min: 41, text: 'Dangerously Hot', dangerousLevel: 3 }, // Protein denaturation, cell death
    { min: 31, text: 'Very Hot', dangerousLevel: 2 }, // High heat stress, photosynthesis halts
    { min: 25, text: 'Warm', dangerousLevel: 1 }, // Optimal for warm-season plants
    { min: 18, text: 'Cool / Mild', dangerousLevel: 0 }, // Optimal for most plants
    { min: 10, text: 'Cold', dangerousLevel: 1 }, // Growth slows, chilling injury for tropicals
    { min: 0, text: 'Very Cold', dangerousLevel: 2 }, // Frost risk, dormancy induced
    { min: -10, text: 'Severe Cold', dangerousLevel: 3 }, // Freezing damage and death
    { min: -Infinity, text: 'Extreme Cold', dangerousLevel: 3 },
];

export const HumidityThreshold = [
    { min: 71, text: 'Very Humid', dangerousLevel: 2 }, // High risk of fungal diseases (e.g., powdery mildew)
    { min: 51, text: 'Humid', dangerousLevel: 1 }, // Good for many tropicals, monitor air circulation
    { min: 31, text: 'Comfortable', dangerousLevel: 0 }, // Ideal range for human and most plant health
    { min: 11, text: 'Very Dry', dangerousLevel: 2 }, // High water loss, risk of spider mites
    { min: 0, text: 'Extremely Arid', dangerousLevel: 3 }, // Rapid desiccation and severe stress
];

export const LightIntensityThreshold = [
    { min: 10001, text: 'Full Sun', dangerousLevel: 2 }, // High risk of light burn for many indoor plants; optimal for succulents/veg.
    { min: 5001, text: 'High Light', dangerousLevel: 1 }, // High growth, but still a risk for sensitive plants.
    { min: 2001, text: 'Medium Light', dangerousLevel: 0 }, // Optimal growing range for most common houseplants.
    { min: 501, text: 'Low Light', dangerousLevel: 1 }, // Growth is slow; insufficient for flowering/fruiting plants.
    { min: -Infinity, text: 'Very Low', dangerousLevel: 3 }, // Chronic insufficient light (starvation); plant will decline.
];

export const TextColorThreshold = [
    { min: 3, color: 'text-red-600' },
    { min: 2, color: 'text-orange-600' },
    { min: 1, color: 'text-yellow-500' },
    { min: 0, color: '' },
    { min: -Infinity, color: '' },
];

export const WMO_WEATHER_MAP = {
    // Clear and Clouds
    0: { description: 'Clear sky', icon: faSun },
    1: { description: 'Mainly clear', icon: faSun },
    2: { description: 'Partly cloudy', icon: faCloud },
    3: { description: 'Overcast', icon: faCloud },

    // Fog and Deposition
    45: { description: 'Fog', icon: faSmog },
    48: { description: 'Depositing rime fog', icon: faSmog },

    // Drizzle
    51: { description: 'Light Drizzle', icon: faCloudRain },
    53: { description: 'Moderate Drizzle', icon: faCloudRain },
    55: { description: 'Dense Drizzle', icon: faCloudRain },
    56: { description: 'Light Freezing Drizzle', icon: faSnowflake },
    57: { description: 'Dense Freezing Drizzle', icon: faSnowflake },

    // Rain
    61: { description: 'Slight Rain', icon: faCloudRain },
    63: { description: 'Moderate Rain', icon: faCloudShowersHeavy },
    65: { description: 'Heavy Rain', icon: faCloudShowersHeavy },
    66: { description: 'Light Freezing Rain', icon: faSnowflake },
    67: { description: 'Heavy Freezing Rain', icon: faSnowflake },

    // Snow
    71: { description: 'Slight Snow fall', icon: faSnowflake },
    73: { description: 'Moderate Snow fall', icon: faSnowflake },
    75: { description: 'Heavy Snow fall', icon: faSnowflake },
    77: { description: 'Snow grains', icon: faSnowflake },

    // Showers
    80: { description: 'Slight Rain Showers', icon: faCloudShowersWater },
    81: { description: 'Moderate Rain Showers', icon: faCloudShowersWater },
    82: { description: 'Violent Rain Showers', icon: faCloudShowersHeavy },
    85: { description: 'Slight Snow Showers', icon: faSnowflake },
    86: { description: 'Heavy Snow Showers', icon: faSnowflake },

    // Thunderstorms (using the CloudBolt icon for general storms)
    95: { description: 'Thunderstorm', icon: faCloudBolt },
    96: { description: 'Thunderstorm with slight hail', icon: faCloudBolt },
    99: { description: 'Thunderstorm with heavy hail', icon: faCloudBolt },

    200: { description: 'Loading', icon: faSpinner },
};

// Reusable function to map value to status/color
export function ThresholdDisplay(TextThreshold, value) {
    const matchedRange = TextThreshold.find((range) => value >= range.min);
    const statusText = matchedRange ? matchedRange.text : 'ERROR';
    const statusDangerousLevel = matchedRange ? matchedRange.dangerousLevel : -1;

    const matchColor = TextColorThreshold.find((range) => statusDangerousLevel >= range.min);

    return { text: statusText, dangerousLevel: statusDangerousLevel, textColor: matchColor?.color || '' };
}


// --- 3. The Provider Component ---
export const PlantProvider = ({ children }) => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const { plants, user, refetchPlants } = useAuth(); // Assuming useAuth is available globally

    // --- PLANT METADATA STATE ---
    const [plantNickname, setPlantNickname] = useState("");
    const [plantSpecies, setPlantSpecies] = useState("");
    const [plantAge, setPlantAge] = useState(100);
    const [plantLocation, setPlantLocation] = useState({});

    // --- SENSOR STATE ---
    const [soilMoisture, setSoilMoisture] = useState(0);
    const [temperature, setTemperature] = useState(0);
    const [weather, setWeather] = useState(200);
    const [humidity, setHumidity] = useState(0);
    const [lightIntensity, setLightIntensity] = useState(0);

    // --- LOADING/REFRESH STATE ---
    const [isAppReady, setIsAppReady] = useState(false);
    const [weatherLoading, setWeatherLoading] = useState(false);

    // --- REFS ---
    const mqttClientRef = useRef(null);
    const sensorResolveRef = useRef(null);

    // --- HELPER FUNCTION: Fetch Weather ---
    const getWeather = useCallback(async (location) => {
        // ใช้ Ref เพื่อตรวจสอบสถานะ Loading ภายนอก dependency array ของ useCallback
        // หรือพึ่งพาการตรวจสอบใน try/catch block

        // ตรวจสอบความถูกต้องของ location
        if (!location || !location.lat) return false;

        let success = false;

        // ตั้งสถานะ Loading ก่อน
        setWeatherLoading(true);

        try {
            const response = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=weather_code`
            );
            setWeather(response.data?.current?.weather_code || 0);
            success = true;
        } catch (error) {
            console.error("Failed to fetch weather:", error);
        } finally {
            // ตั้งสถานะ Loading กลับเป็น false
            setWeatherLoading(false);
        }
        return success;
    }, []);;


    // --- CORE FUNCTION: Fetch Sensor Data (via MQTT) ---
    const Get_Sensor = useCallback(() => {
        if (!mqttClientRef.current) return Promise.resolve(); // Don't try if not connected

        return new Promise((resolve) => {
            sensorResolveRef.current = resolve;

            mqttClientRef.current.publish(`/flowey/${uuid}/command`, 'GET_SENSORS', {}, (err) => {
                if (err) {
                    console.error('Failed to publish message:', err);
                    resolve();
                } else {
                    console.log(`Message sent, waiting for reply...`);
                }
            });

            // Safety Timeout
            setTimeout(() => {
                if (sensorResolveRef.current) {
                    console.log("Timeout waiting for sensor data");
                    sensorResolveRef.current();
                    sensorResolveRef.current = null;
                }
            }, 20000);
        });
    }, [uuid]);


    // --- CORE FUNCTION: Refresh All Data ---
    const refreshSensor = useCallback(async () => {
        await refetchPlants(); // Ensure plant list is up-to-date
        await Get_Sensor(); // Get latest sensor data via MQTT
        // getWeather needs to be called AFTER plantLocation is set by the initial useEffect
        // For simplicity, we'll rely on the location state which is set in the first effect.
        if (plantLocation && plantLocation.lat) {
            await getWeather(plantLocation);
        }
    }, [refetchPlants, Get_Sensor, plantLocation, getWeather]);


    // --- EFFECT 1: Initial Plant Data Loading ---
    useEffect(() => {
        if (plants && plants.length > 0 && uuid) {
            const targetPlant = plants.find((p) => p.uuid === uuid);

            if (targetPlant) {
                // Reset/Set Plant Details
                setPlantNickname(targetPlant.nickname);
                setPlantSpecies(targetPlant.species);

                // Handle Location
                let location = {};
                try {
                    if (targetPlant.location) {
                        location = JSON.parse(targetPlant.location);
                        setPlantLocation(location);
                        // Initial weather fetch (it will run in the background)
                        getWeather(location);
                    }
                } catch (error) {
                    console.error("Error parsing location JSON:", error);
                }

                // Handle Age
                if (targetPlant.birth) {
                    const birthDate = new Date(targetPlant.birth);
                    const diffDays = Math.floor(Math.abs(new Date() - birthDate) / (1000 * 60 * 60 * 24));
                    setPlantAge(diffDays);
                }

                // Once plant data is loaded, we can allow MQTT to start (if not yet)
                // This ensures the readiness state is updated
                if (mqttClientRef.current) setIsAppReady(true);
            } else {
                // Plant not found, redirect
                navigate('/', { replace: true });
            }
        }
    }, [plants, uuid, navigate, getWeather]);


    // --- EFFECT 2: MQTT Connection and Listener Setup ---
    useEffect(() => {
        if (!uuid || mqttClientRef.current) return;

        console.log('Initializing MQTT...');

        const clientId = `mqtt_flowey_${authService.getDeviceId()}_${Math.random().toString(16).slice(2)}`;

        const client = mqtt.connect(import.meta.env.VITE_MQTT_BROKER_URL, {
            clientId,
            clean: true,
            connectTimeout: 4000,
            username: 'sad',
            password: 'sad',
            reconnectPeriod: 5000,
        });

        mqttClientRef.current = client;

        client.on('connect', () => {
            console.log('Connected to MQTT');
            client.subscribe(`/flowey/${uuid}/sensors`, (err) => {
                if (!err) {
                    console.log(`Subscribed to /flowey/${uuid}/sensors`);
                    // Now that MQTT is connected AND subscribed, the app is ready for sensor calls
                    setIsAppReady(true);
                }
            });
        });

        client.on('message', (topic, message) => {
            try {
                const sensorData = JSON.parse(message.toString());
                setSoilMoisture(sensorData.soil);
                setTemperature(sensorData.temp);
                setHumidity(sensorData.humid);
                setLightIntensity(sensorData.light);

                if (sensorResolveRef.current) {
                    sensorResolveRef.current();
                    sensorResolveRef.current = null;
                }
            } catch (error) {
                console.error("Received invalid JSON:", message.toString());
            }
        });

        return () => {
            if (client) {
                console.log('Cleaning up MQTT connection...');
                client.end(true);
                mqttClientRef.current = null;
                setIsAppReady(false);
            }
        };
    }, [uuid]);


    // --- CONTEXT VALUE ---
    const contextValue = {
        // Metadata
        plantNickname,
        plantSpecies,
        plantAge,
        plantLocation,

        // Sensor Data
        soilMoisture,
        temperature,
        weather,
        humidity,
        lightIntensity,

        // Utils
        isAppReady,
        refreshSensor,
    };

    return (
        <PlantContext.Provider value={contextValue}>
            {children}
        </PlantContext.Provider>
    );
};