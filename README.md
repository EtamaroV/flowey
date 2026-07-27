# Flowey 🌱

Flowey is a modern React-based Progressive Web Application (PWA) tailored for plant tracking and management. It is designed to work seamlessly with our custom Arduino MQTT library for real-time hardware monitoring.

## 🔗 Hardware Integration

Flowey is built to connect with the physical world! If you want to connect your own IoT devices (like ESP32 or ESP8266) to monitor soil moisture, temperature, and light levels in real-time, check out our companion Arduino library:

👉 **[FloweyMqtt Arduino Library](https://github.com/EtamaroV/FloweyMqtt)**

The `FloweyMqtt` library handles the device-side communication, publishing sensor data to the MQTT broker, which this React application then consumes and displays in the Plant Chat and Dashboard interfaces.

## 🚀 Tech Stack

*   **Framework:** React + Vite
*   **Styling:** Tailwind CSS
*   **PWA Support:** Vite PWA Plugin
*   **State Management:** React Context (`authContext`, `plantContext`)
*   **Linting:** ESLint

## ✨ Key Features

*   **IoT Ready:** Integrates with [FloweyMqtt](https://github.com/EtamaroV/FloweyMqtt) for live sensor data.
*   **User Authentication:** Secure login and registration portal.
*   **Plant Management:** Add, view, and interact with your plants.
*   **Plant Chat:** A specialized chat interface for plant-related data or interactions.
*   **Location Picker:** Select and manage location data for optimal plant care.
*   **PWA Ready:** Installable on devices with offline-ready caching and app badges.
*   **Custom Animations:** Features a customized UI with animated primitives.

## 📂 Project Structure

*   `/src/components/`: Reusable UI elements (`NavBar`, `location-picker`, `ui/button`, `ui/input`).
*   `/src/views/`: Main application screens (`Home`, `AddPlant`, `PlantView`, `PlantChat`, `auth/LoginRegister`).
*   `/src/contexts/`: Application-wide state providers.
*   `/src/services/`: API and external service integrations (`authService.js`).
*   `/src/assets/`: Custom SVG icon components (e.g., `PlantSymbol`, `AchievementSymbol`).

## 🛠️ Getting Started

### Prerequisites

*   Node.js (v16+ recommended)
*   npm or yarn

### Installation & Setup

1.  Install the project dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Build for production:
    ```bash
    npm run build
    ```

## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. 
See the `LICENSE` file for more details.
