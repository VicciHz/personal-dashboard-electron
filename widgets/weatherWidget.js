// widgets/weatherWidget.js

// Initializes a single Weather widget instance
// Takes element IDs for displaying info/details, and the global dashboardSettings object.
// Needs access to dashboardSettings for weather configuration (location, key, unit).
export function initWeatherWidget(infoElementId, detailsElementId, dashboardSettings) {
    // Get references to the specific elements for this widget instance
    const weatherInfoElement = document.getElementById(infoElementId); // Element for temperature/icon
    const weatherDetailsElement = document.getElementById(detailsElementId); // Element for location/description

    // Define the base URL for the weather API (OpenWeatherMap)
    const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
    // Define the update interval (e.g., every 30 minutes)
    const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

    // --- Basic validation for elements ---
    // Check if both necessary elements were found
     if (!weatherInfoElement || !weatherDetailsElement) {
         console.error(`Weather elements not found for widget (info: ${infoElementId}, details: ${detailsElementId}). Initialization failed.`);
          // Return a dummy cleanup function if initialization failed
         return null; // Indicate initialization failure
     }

    // --- Function to fetch and update weather for this specific widget instance ---
    // This function is called initially and periodically by an interval.
    // It uses the weather settings from the global dashboardSettings object.
    async function updateWeatherInstance() {
        console.log(`Updating weather for widget (info: ${infoElementId})`);
        // Get the weather configuration from the global settings
        const location = dashboardSettings.weather?.location; // Use optional chaining for safety
        const apiKey = dashboardSettings.weather?.apiKey;
        const unit = dashboardSettings.weather?.unit; // 'metric' or 'imperial'

        // Check if API Key or Location are missing
        if (!apiKey) {
            weatherInfoElement.textContent = '-';
            weatherDetailsElement.textContent = 'API Key Missing';
            console.warn('Weather API Key is missing in settings.');
            return; // Stop if API key is missing
        }
         if (!location) {
             weatherInfoElement.textContent = '-';
             weatherDetailsElement.textContent = 'Location Missing';
             console.warn('Weather Location is missing in settings.');
             return; // Stop if location is missing
         }


        // Construct the API URL
        // Encode the location for safety in the URL
        const url = `${WEATHER_API_BASE_URL}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${unit}`;

        try {
            // Fetch data from the weather API
            const response = await fetch(url);
            // Parse the JSON response
            const data = await response.json();

            // Check if the HTTP response was successful (status code 200-299)
            if (response.ok) {
                // Determine the temperature unit symbol based on the selected unit
                const tempUnit = unit === 'metric' ? '°C' : '°F';
                // Update the info element with temperature and unit
                weatherInfoElement.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
                // Update the details element with city name and weather description
                weatherDetailsElement.textContent = `${data.name}: ${data.weather[0].description}`;
                 console.log(`Weather updated successfully for ${data.name}.`);

            } else {
                // If the response was not OK, display an error message
                weatherInfoElement.textContent = '-';
                weatherDetailsElement.textContent = `Error: ${data.message || 'Unknown error'}`;
                console.error('Weather API Error:', data);
            }

        } catch (error) {
            // Handle errors during the fetch process (e.g., network error)
            weatherInfoElement.textContent = '-';
            weatherDetailsElement.textContent = 'Failed to fetch';
            console.error('Failed to fetch weather:', error);
        }
    }

    // --- Set up Interval for Periodic Updates ---
    // Set an interval to call updateWeatherInstance periodically
    const intervalId = setInterval(updateWeatherInstance, UPDATE_INTERVAL_MS);

    // --- Initial Update ---
    // Call updateWeatherInstance immediately when the widget is initialized
    updateWeatherInstance();

    // *** Return an object containing update and cleanup functions ***
    return {
        // Return the update function so it can be called manually from renderer.js (e.g., when settings change)
        update: updateWeatherInstance,
        // Return a cleanup function to clear the interval when the widget is removed
        cleanup: () => {
            clearInterval(intervalId); // Clear the interval using its ID
            console.log(`Weather interval cleared for info element ID: ${infoElementId}`);
            // Add any other cleanup needed here
        }
    };
}