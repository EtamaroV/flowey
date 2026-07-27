# Flowey 🌱

Flowey is a modern React-based Progressive Web Application (PWA) tailored for plant tracking and management. 

## 🚀 Tech Stack

*   **Framework:** React + Vite
*   **Styling:** Tailwind CSS
*   **PWA Support:** Vite PWA Plugin
*   **State Management:** React Context (`authContext`, `plantContext`)
*   **Linting:** ESLint

## ✨ Key Features

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

## 🔒 Security Best Practices

*   Ensure all environmental variables are stored securely in a `.env` file.
*   Verify that `.env` is included in your `.gitignore`.
*   Avoid hardcoding API keys, JWT secrets, or Firebase/Supabase configuration details in client-side services.
