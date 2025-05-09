// renderer.js

// --- Imports ---
// Import the initialization function for each widget from its separate file.
// Ensure these paths are correct relative to renderer.js (assuming widgets folder is sibling to renderer.js)
import { initClockWidget } from './widgets/clockWidget.js';
import { initDateWidget } from './widgets/dateWidget.js';
import { initTodosWidget } from './widgets/todoWidget.js';
import { initWeatherWidget } from './widgets/weatherWidget.js';
import { initPomodoroWidget } from './widgets/pomodoroWidget.js';
import { initClipboardWidget } from './widgets/clipboardWidget.js'; // Import Clipboard Widget init


// Using a simplified path join relevant for the renderer context:
// This function is not strictly necessary if you just use string concatenation like './assets/' + filename
// For clarity, the code below uses simple string concatenation.
// function joinPaths(base, file) {
//     // Basic example, may not handle all edge cases
//     return `${base}/${file}`;
// }


// --- Global State and Elements ---
let dashboardSettings = {}; // Object to hold all loaded/saved application settings
// Array to store objects representing active widget instances.
// Each object will contain widget metadata, its ID, config, and potentially cleanup/update functions.
let activeWidgets = [];
const dashboardContainer = document.querySelector('.dashboard-container'); // The main DOM element where widgets are appended
const welcomeMessageElement = document.getElementById('welcome-message'); // DOM element for the welcome message

// Get references to both background elements from the DOM
const backgroundVideoElement = document.getElementById('background-video'); // The <video> tag for background
const backgroundImageElement = document.getElementById('background-image'); // The <img> tag for background


// --- Settings Panel Elements ---
const settingsPanel = document.getElementById('settings-panel'); // The modal panel for settings
const settingsBtn = document.getElementById('settings-btn'); // Button that opens the settings panel
const saveSettingsBtn = document.getElementById('save-settings-btn'); // Button in settings panel to save changes
const cancelSettingsBtn = document.getElementById('cancel-settings-btn'); // Button in settings panel to discard changes

// Get references to all settings form inputs
const welcomeMessageInput = document.getElementById('welcome-message-input'); // Input for the welcome message
const backgroundSelect = document.getElementById('background-select'); // Select dropdown for background file selection

const backgroundBlurSlider = document.getElementById('background-blur-slider'); // Slider for background blur filter
const backgroundBlurValueSpan = document.getElementById('background-blur-value'); // Span to display the current blur value
const backgroundOpacitySlider = document.getElementById('background-opacity-slider'); // Slider for background opacity
const backgroundOpacityValueSpan = document.getElementById('background-opacity-value'); // Span to display the current opacity value

const weatherLocationInput = document.getElementById('weather-location'); // Input for weather location
const weatherApiKeyInput = document.getElementById('weather-api-key'); // Input for OpenWeatherMap API key
const weatherUnitSelect = document.getElementById('weather-unit'); // Select for weather units (metric/imperial)

// Add event listeners to the sliders to update the displayed value spans as the slider is moved
backgroundBlurSlider.addEventListener('input', () => {
    backgroundBlurValueSpan.textContent = `${backgroundBlurSlider.value}px`;
});
backgroundOpacitySlider.addEventListener('input', () => {
    backgroundOpacityValueSpan.textContent = backgroundOpacitySlider.value;
});


// Define Available Backgrounds
// This array lists the background files that can be selected by the user.
// The 'name' should match the filename in the assets folder.
// The 'type' should be 'video' or 'image'.
const availableBackgrounds = [
    { name: 'background.mp4', type: 'video' }, // Make sure you have assets/background.mp4
    { name: 'sample-image.jpg', type: 'image' }, // Make sure you have assets/sample-image.jpg
    // Add more backgrounds here as needed:
    // { name: 'another-video.webm', type: 'video' }, // Make sure you have assets/another-video.webm
    // { name: 'another-image.png', type: 'image' }, // Make sure you have assets/another-image.png
];


// --- Add Widget Elements ---
const addWidgetBtn = document.getElementById('add-widget-btn'); // Button to open the add widget panel
const widgetSelectionPanel = document.getElementById('widget-selection-panel'); // The modal panel for adding widgets
const widgetListUl = document.getElementById('widget-list'); // The <ul> element listing available widgets
const cancelAddWidgetBtn = document.getElementById('cancel-add-widget-btn'); // Button to cancel adding a widget


// --- Widget Definitions ---
// This object maps widget type keys (strings) to their definition objects.
// Each definition includes:
// - title: The display name shown in the add widget list.
// - getHtml: A function that returns the HTML string for a widget instance, given its unique ID.
// - init: The initialization function from the widget's corresponding JS file.
//   It's responsible for finding the widget's elements, setting up its logic, and returning cleanup/update functions.
//   It receives the widget's ID, config, the global dashboardSettings, and the exposed electronAPI.
// - config: Default configuration settings specific to a new instance of this widget type.
const widgetTypes = {
    'clock': {
        title: 'Clock',
        getHtml: (id) => `<div class="widget clock-widget" id="widget-${id}"><button class="remove-widget" data-widget-id="${id}">X</button><h2>Time</h2><div id="current-time-${id}">-</div></div>`,
        // The init function is called when the widget is added or rendered.
        // It gets element IDs based on the unique widget ID.
        init: (id, config, dashboardSettings, electronAPI) => initClockWidget(`current-time-${id}`), // Pass element ID
        config: {} // No specific config needed for the clock widget
    },
    'date': {
         title: 'Date',
         getHtml: (id) => `<div class="widget date-widget" id="widget-${id}"><button class="remove-widget" data-widget-id="${id}">X</button><h2>Date</h2><div id="current-date-${id}">-</div></div>`,
         init: (id, config, dashboardSettings, electronAPI) => initDateWidget(`current-date-${id}`), // Pass element ID
         config: {} // No specific config needed for the date widget
    },
    'todo': {
        title: 'To-Dos',
        getHtml: (id) => `<div class="widget todo-widget" id="widget-${id}"><button class="remove-widget" data-widget-id="${id}">X</button><h2>To-Dos</h2><div class="todo-input-container"><input type="text" id="new-todo-input-${id}" placeholder="Add new todo"><button id="add-todo-btn-${id}">Add</button></div><ul id="todo-list-${id}"></ul></div>`,
        // Pass element IDs, widget ID, the global dashboardSettings, AND the saveDashboardSettings function
        // The To-Do widget needs to call saveDashboardSettings when its data changes.
        init: (id, config, dashboardSettings, electronAPI) => initTodosWidget(`new-todo-input-${id}`, `add-todo-btn-${id}`, `todo-list-${id}`, id, dashboardSettings, saveDashboardSettings),
        config: {} // No specific config needed for the todo widget itself (data is in dashboardSettings.widgets)
    },
    'weather': {
        title: 'Weather',
        getHtml: (id) => `<div class="widget weather-widget" id="widget-${id}"><button class="remove-widget" data-widget-id="${id}">X</button><h2>Weather</h2><div id="weather-info-${id}">Loading weather...</div><div id="weather-details-${id}"></div></div>`,
        // Pass element IDs and the global dashboardSettings (weather settings are within it)
        init: (id, config, dashboardSettings, electronAPI) => initWeatherWidget(`weather-info-${id}`, `weather-details-${id}`, dashboardSettings),
        config: {} // Weather config comes from dashboardSettings.weather
    },
    'pomodoro': {
        title: 'Pomodoro Timer',
        getHtml: (id) => `<div class="widget pomodoro-widget" id="widget-${id}"><button class="remove-widget" data-widget-id="${id}">X</button><h2>Pomodoro</h2><div id="pomodoro-timer-${id}">25:00</div><div class="pomodoro-controls"><button id="start-pomodoro-btn-${id}">Start</button><button id="pause-pomodoro-btn-${id}" disabled>Pause</button><button id="reset-pomodoro-btn-${id}" disabled>Reset</button></div><div id="pomodoro-status-${id}">Ready</div></div>`,
         // Pass element IDs, widget ID, and the exposed electronAPI for notifications
         init: (id, config, dashboardSettings, electronAPI) => initPomodoroWidget(id, `pomodoro-timer-${id}`, `start-pomodoro-btn-${id}`, `pause-pomodoro-btn-${id}`, `reset-pomodoro-btn-${id}`, `pomodoro-status-${id}`, electronAPI),
        config: {} // No specific config needed for the pomodoro widget
    },
    // New: Add the Clipboard Widget definition
    'clipboard': {
        title: 'Clipboard',
        // Add an element with a unique ID where the clipboard content will be displayed
        getHtml: (id) => `<div class="widget clipboard-widget" id="widget-${id}"><button class="remove-widget" data-widget-id="${id}">X</button><h2>Clipboard</h2><div id="clipboard-content-${id}">Loading clipboard...</div></div>`,
        // Pass the element ID, widget ID, dashboardSettings (if needed), and the exposed electronAPI
        init: (id, config, dashboardSettings, electronAPI) => initClipboardWidget(`clipboard-content-${id}`, id, dashboardSettings, electronAPI),
        config: {} // No specific config needed for the clipboard widget
    }
    // Add more widget types here following the same structure
};

// --- Utility: Generate unique ID ---
// Generates a simple UUID-like string for widget instance IDs
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


// --- Widget Rendering and Management ---

// Function to add a widget to the dashboard
// This is called when adding a new widget via the panel or when rendering from saved state.
function addWidget(widgetType, widgetState = null) {
    // Find the definition for the requested widget type
    const widgetDefinition = widgetTypes[widgetType];
    if (!widgetDefinition) {
        console.error(`Unknown widget type: "${widgetType}". Cannot add widget.`);
        return null; // Indicate that the widget could not be added
    }

    // Determine the unique ID for this widget instance:
    // Use the existing ID if provided (when loading from saved state), otherwise generate a new one.
    const id = widgetState?.id || uuidv4();
    // Determine the configuration for this widget instance:
    // Use the existing config if provided (when loading), otherwise make a deep copy of the default config from the definition.
    const config = widgetState?.config || JSON.parse(JSON.stringify(widgetDefinition.config));

    // Generate the HTML string for this specific widget instance using its unique ID
    const widgetHtml = widgetDefinition.getHtml(id);
    // Insert the generated HTML into the dashboard container in the DOM
    dashboardContainer.insertAdjacentHTML('beforeend', widgetHtml);

    // Find the remove button within the newly added widget element and attach its event listener
    // We query within the dashboardContainer to find the button for the specific widget ID
    const removeButton = dashboardContainer.querySelector(`#widget-${id} .remove-widget`);
    if (removeButton) {
        // Attach a click listener that calls removeWidget with the widget's unique ID
        removeButton.addEventListener('click', () => removeWidget(id));
    }

    // Initialize the widget's specific JavaScript logic by calling its init function
    // Pass all necessary arguments to the init function (ID, config, global settings, electronAPI)
    // The init function is expected to set up event listeners, start intervals, fetch data, etc.
    // It may also return an object containing cleanup and update functions.
    const initResult = widgetDefinition.init(id, config, dashboardSettings, window.electronAPI);

    // Create an entry object to represent this active widget instance in the activeWidgets array
    const newWidgetEntry = {
        id: id, // Store the unique ID
        type: widgetType, // Store the widget type string
        config: config, // Store the instance-specific config
        // Store the cleanup function returned by the init function, or null if none was returned
        cleanup: typeof initResult?.cleanup === 'function' ? initResult.cleanup : null,
        // Store the update function returned by the init function (e.g., for weather), or null
        update: typeof initResult?.update === 'function' ? initResult.update : null
    };

    // Add or update the widget entry in the global activeWidgets array
    const existingWidgetIndex = activeWidgets.findIndex(w => w.id === id);
    if (existingWidgetIndex > -1) {
         // If rendering an existing widget from saved state, update its entry in the array
         activeWidgets[existingWidgetIndex] = newWidgetEntry;
    } else {
         // If adding a brand new widget, push the new entry to the array
         activeWidgets.push(newWidgetEntry);
    }

    // *** Save the updated list of active widgets (and all settings) ***
    // Only trigger a save if a NEW widget was added (not on initial rendering from saved state)
    if (!widgetState) {
        saveDashboardSettings();
         console.log(`Added new widget: ${widgetType} with ID: ${id}`);
    }

    return newWidgetEntry; // Return the object representing the added widget instance
}

// Function to remove a widget from the dashboard
// Called when the remove button on a widget is clicked
function removeWidget(id) {
    // Find the index of the widget to remove in the activeWidgets array based on its ID
    const widgetIndex = activeWidgets.findIndex(widget => widget.id === id);

    // Check if the widget was found
    if (widgetIndex > -1) {
        const widgetToRemove = activeWidgets[widgetIndex];

        // *** Call the cleanup function if it exists ***
        // This is essential to stop intervals, remove listeners, etc., for the removed widget.
        if (typeof widgetToRemove.cleanup === 'function') {
            widgetToRemove.cleanup();
        }

        // Remove the widget entry from the global activeWidgets array
        activeWidgets.splice(widgetIndex, 1);

        // Find and remove the widget's HTML element from the DOM
        const widgetElement = document.getElementById(`widget-${id}`);
        if (widgetElement) {
            widgetElement.remove();
        }

        // *** Clean up any specific data stored for this widget instance in dashboardSettings.widgets ***
        // This prevents orphaned data for widgets like To-Dos after they are removed.
        if (dashboardSettings.widgets && dashboardSettings.widgets[id]) {
            delete dashboardSettings.widgets[id];
             console.log(`Cleaned up settings data for removed widget ID: ${id}`);
        }

        // *** Save the updated list of active widgets (and all settings) after removal ***
        saveDashboardSettings();
         console.log(`Widget removed with ID: ${id}`);
    } else {
        // Log a warning if trying to remove a widget that doesn't seem to exist in the active list
        console.warn(`Attempted to remove non-existent widget with ID: ${id}`);
    }
}

// Function to render all active widgets based on the state loaded from settings
// This is called once on application startup after settings are loaded.
function renderActiveWidgets() {
    console.log("Rendering active widgets...");
    // *** Crucially: Call cleanup for all currently active widgets BEFORE clearing the container ***
    // This ensures resources from any previously rendered widgets are released.
    activeWidgets.forEach(widget => {
        if (typeof widget.cleanup === 'function') {
            widget.cleanup();
        }
    });

    // Clear the dashboard container's HTML to prepare for rendering
    dashboardContainer.innerHTML = '';
    // Reset the global activeWidgets array. It will be repopulated by addWidget calls.
    activeWidgets = [];

    // Get the list of widgets to render from the loaded dashboardSettings
    // Ensure it's an array, default to empty array if not
    const widgetsToRender = Array.isArray(dashboardSettings.activeWidgets) ? dashboardSettings.activeWidgets : [];

    // Loop through the loaded widget data and add/initialize each one
    widgetsToRender.forEach(widget => {
         // Find the widget definition by its type
         const widgetDefinition = widgetTypes[widget.type];
         if (widgetDefinition) {
             // Add the widget, passing its saved state (id and config)
             addWidget(widget.type, widget);
         } else {
             // Log an error if a saved widget type is unknown and cannot be rendered
             console.error(`Could not render unknown widget type: "${widget.type}" with ID: "${widget.id}". It will not be re-added.`);
             // Invalid widget types are simply skipped and will not be put back into the activeWidgets array
         }
    });
    // Note: The global activeWidgets array is populated by the addWidget calls within this loop.
    console.log("Finished rendering active widgets. Current activeWidgets:", activeWidgets);
}


// --- Save Dashboard Settings (Centralized) ---
// This is the single function responsible for saving the entire dashboardSettings object to electron-store via IPC.
// It is called from addWidget, removeWidget, saveSettingsFromPanel, and from within widgets (like To-Do) when their data changes.
async function saveDashboardSettings() {
    console.log("Attempting to save dashboard settings...");
    // Check if the electronAPI object and the saveSettings method are available (means running in Electron and preload script ran)
    if (window.electronAPI && typeof window.electronAPI.saveSettings === 'function') {
        try {
            // --- Data Preparation for Saving ---
            // Ensure necessary nested objects/arrays exist in dashboardSettings before saving
            // This prevents saving undefined/null where arrays/objects are expected later.
            if (!Array.isArray(dashboardSettings.activeWidgets)) {
                 dashboardSettings.activeWidgets = [];
             }
             if (typeof dashboardSettings.widgets !== 'object' || dashboardSettings.widgets === null) {
                 dashboardSettings.widgets = {};
             }

            // Create a serializable copy of the dashboardSettings object for sending over IPC.
            // Importantly, remove non-serializable properties like function references (cleanup, update) from activeWidgets entries.
            const serializableSettings = {
                 ...dashboardSettings, // Spread all other settings properties (welcomeMessage, background, weather, widgets etc.)
                 activeWidgets: dashboardSettings.activeWidgets.map(w => ({
                      id: w.id, // Include unique ID
                      type: w.type, // Include widget type
                      config: w.config // Include instance-specific config (if any, like initial state)
                      // EXCLUDE cleanup and update functions as they cannot be serialized
                 }))
                 // The data stored in dashboardSettings.widgets (like To-Do items) is assumed to be serializable (JSON data like arrays, objects, primitives).
            };

            // console.log("Saving serializable settings:", serializableSettings); // Debugging line

            // Send the serializable settings object to the main process via the exposed IPC method.
            // Await the result (ipcRenderer.invoke could be used here if main sent a specific confirmation response).
            await window.electronAPI.saveSettings(serializableSettings);
            console.log('Dashboard settings saved successfully!', dashboardSettings);

        } catch (error) {
            // Log any errors that occur during the saving process
            console.error('Failed to save dashboard settings:', error);
            // Optionally show an error message to the user in the UI
            // alert('Error saving settings.'); // Example
        }
    } else {
        // Log a warning if the electronAPI or saveSettings method is not available
        console.error('electronAPI.saveSettings not available. Settings cannot be saved.');
        // Handle case where IPC is not available (e.g., running the HTML file directly in a browser)
    }
}


// --- Apply Dashboard Settings ---
// This function updates the UI elements based on the current state of the global dashboardSettings object.
// It is called after loading settings on startup, after saving settings from the panel, and when settings are updated from the main process.
function applySettings() {
    console.log("Applying settings:", dashboardSettings); // Log the settings being applied

    // Apply General Settings
    // Set the text content of the welcome message element
    welcomeMessageElement.textContent = dashboardSettings.welcomeMessage || ''; // Use stored message, default to empty string if undefined/null

    // Apply Background Settings (Video or Image from predefined list)
    const selectedBackgroundName = dashboardSettings.backgroundFile; // Get the selected background file name from settings
    const blur = dashboardSettings.backgroundBlur || 0; // Get blur value, default to 0 if undefined/null
    // Get opacity value, default to 1 (fully opaque) if not set or is undefined
    const opacity = dashboardSettings.backgroundOpacity !== undefined ? dashboardSettings.backgroundOpacity : 1;

    // --- Manage Background Element Visibility and Source ---
    // Hide both background elements first to ensure only one is shown
    backgroundVideoElement.classList.remove('active'); // Remove 'active' class
    backgroundImageElement.classList.remove('active'); // Remove 'active' class
    backgroundVideoElement.removeAttribute('src'); // Clear video source attribute
    backgroundImageElement.removeAttribute('src'); // Clear image source attribute
    backgroundVideoElement.load(); // Trigger video element to process source change/clear

    // Find the details (name, type) of the selected background in the predefined list
    const selectedBackground = availableBackgrounds.find(bg => bg.name === selectedBackgroundName);

    // Check if a background file is selected (name is not empty) and found in the available list
    if (selectedBackground) {
        // Construct the path to the background file relative to the renderer's location (index.html)
        // Assumes the 'assets' folder is located at the same level as index.html
        // Use simple string concatenation for the relative path
        const filePath = './assets/' + selectedBackground.name;

        // Determine if the selected background is a video or an image based on its type property
        if (selectedBackground.type === 'video') {
            // If it's a video:
            backgroundVideoElement.classList.add('active'); // Add 'active' class to show the video element
            backgroundVideoElement.src = filePath; // Set the video source
            backgroundVideoElement.load(); // Load the new video source
            // Attempt to play the video (autoplays and loops based on HTML attributes)
            backgroundVideoElement.play().catch(error => console.error('Background video playback error:', error)); // Catch potential playback errors

             // Apply filter (brightness and blur) and opacity styles to the active video element
             backgroundVideoElement.style.filter = `brightness(50%) blur(${blur}px)`; // Combine brightness and blur
             backgroundVideoElement.style.opacity = opacity; // Set opacity

        } else if (selectedBackground.type === 'image') {
            // If it's an image:
            backgroundImageElement.classList.add('active'); // Add 'active' class to show the image element
            backgroundImageElement.src = filePath; // Set the image source

             // Apply filter (brightness and blur) and opacity styles to the active image element
             backgroundImageElement.style.filter = `brightness(50%) blur(${blur}px)`; // Combine brightness and blur
             backgroundImageElement.style.opacity = opacity; // Set opacity

        } else {
             // Log a warning if the background type is defined but not supported (neither video nor image)
             console.warn('Unsupported background type specified in availableBackgrounds list for:', selectedBackground.name, '- type:', selectedBackground.type);
        }

         // If the settings panel is currently visible, update the background dropdown's selection to match the applied setting
         if (settingsPanel.classList.contains('visible')) {
              backgroundSelect.value = selectedBackgroundName; // Set the dropdown value to the name of the applied file
         }

    } else {
        // This block executes if:
        // 1. dashboardSettings.backgroundFile is empty ('') or null/undefined (user selected 'None').
        // 2. The selected file name doesn't match any name in the availableBackgrounds list.
        console.warn('No valid background file selected or found in available list:', selectedBackgroundName);
        // Handle the case where no background is set (e.g., show a solid color or default)

         // As a fallback, if no valid background is set but availableBackgrounds is not empty, default to the first one
         if (availableBackgrounds.length > 0) {
             console.log("No valid background set, falling back to the first available background:", availableBackgrounds[0].name);
             dashboardSettings.backgroundFile = availableBackgrounds[0].name; // Update the setting in the global state
             // *** Recursively call applySettings to apply the new default background ***
             applySettings();
         } else {
             // If there are no available backgrounds defined at all
             console.warn("No available backgrounds defined to fall back to.");
              // Optionally clear styles if no background is set and no fallback is available
              backgroundVideoElement.style.filter = '';
              backgroundVideoElement.style.opacity = '';
              backgroundImageElement.style.filter = '';
              backgroundImageElement.style.opacity = '';
              // Ensure the background select dropdown is set to the 'None' option if the panel is visible
               if (settingsPanel.classList.contains('visible')) {
                   backgroundSelect.value = ''; // Set dropdown to empty value ('None')
               }
         }
    }

    // Apply Weather Settings (Triggers update for all weather widgets)
    // Find all active widget instances that are of type 'weather' AND have an 'update' function
     activeWidgets.filter(w => w.type === 'weather' && typeof w.update === 'function').forEach(w => {
         w.update(); // Call the specific update function for each weather widget instance
     });

    // Apply other general settings here as you add them that affect the overall UI
    // e.g., body classes, font sizes, etc.
}


// --- Window Controls (for frameless window) ---
// Get references to the custom window control buttons
const minimizeBtn = document.getElementById('minimize-btn'); // Minimize button
const maximizeBtn = document.getElementById('maximize-btn'); // Maximize/Restore button
const closeBtn = document.getElementById('close-btn'); // Close button


// Check if the electronAPI object is available on the window object.
// This object is exposed by the preload script and indicates that the app is running in Electron.
if (window.electronAPI) {
    // Attach click listeners to the custom window control buttons
    // These listeners call the exposed functions from the preload script, which send IPC messages to the main process.
    minimizeBtn.addEventListener('click', () => window.electronAPI.minimizeWindow());
    maximizeBtn.addEventListener('click', () => window.electronAPI.maximizeWindow());
    closeBtn.addEventListener('click', () => window.electronAPI.closeWindow());

    // Attach listener for the Add Widget button to show the selection panel
    addWidgetBtn.addEventListener('click', () => {
        showWidgetSelectionPanel();
    });

    // Attach listener for the Settings button to show the settings panel
    settingsBtn.addEventListener('click', () => {
        showSettingsPanel();
    });

     // *** Listen for settings updates pushed from the main process ***
     // The main process sends a 'settings-updated' message after saving settings (e.g., via saveDashboardSettings).
     // This listener updates the renderer's global settings state and applies the changes to the UI.
    window.electronAPI.onSettingsUpdated((updatedSettings) => {
        console.log('Settings updated from main process received:', updatedSettings);
        // Update the renderer's global dashboardSettings object with the latest data
        dashboardSettings = updatedSettings;
         // If the settings panel is currently open, re-populate the form to reflect the updated settings
        if (settingsPanel.classList.contains('visible')) {
             populateSettingsForm(dashboardSettings);
        }
        // Apply the updated settings to the UI elements
        applySettings();
         console.log('Settings updated and applied.');
    });

} else {
    // This block executes if window.electronAPI is NOT available (i.e., running the HTML file directly in a standard browser).
    console.warn('electronAPI not available. Running in a non-Electron environment.');
    // Hide the custom window controls as they won't work
    const windowControls = document.getElementById('window-controls');
    if (windowControls) windowControls.style.display = 'none';
    const titlebar = document.getElementById('titlebar');
    // Disable the draggable area if the custom titlebar is used
    if(titlebar) titlebar.style['-webkit-app-region'] = 'no-drag';
    // Hide the Add Widget button as widget functionality relies on Electron/IPC
    if (addWidgetBtn) addWidgetBtn.style.display = 'none';
     console.warn('Window controls and widget adding disabled in non-Electron environment.');
}


// --- Settings Panel Logic ---
// Functions to manage the display and interaction of the settings panel modal.

// Shows the settings panel
function showSettingsPanel() {
    console.log("Showing settings panel.");
    // Populate the settings form inputs with the current global dashboard settings
    populateSettingsForm(dashboardSettings);
    // Add the 'visible' class to the settings panel element to make it appear (handled by CSS)
    settingsPanel.classList.add('visible');
}

// Hides the settings panel
function hideSettingsPanel() {
    console.log("Hiding settings panel.");
    // Remove the 'visible' class from the settings panel element to hide it (handled by CSS)
    settingsPanel.classList.remove('visible');
}

// Populates the HTML form elements in the settings panel with values from the provided settings object.
function populateSettingsForm(settings) {
    console.log("Populating settings form with:", settings); // Debugging log

    // Populate General Settings inputs
    welcomeMessageInput.value = settings.welcomeMessage || ''; // Set input value, default to empty string

    // Populate Background Settings Select dropdown
    // Call the specific function to populate the dropdown options and set the selected value
    populateBackgroundSelect(settings.backgroundFile); // Pass the currently selected file name

    // Populate Background Blur Slider and update its value display span
    backgroundBlurSlider.value = settings.backgroundBlur !== undefined ? settings.backgroundBlur : 10;
    backgroundBlurValueSpan.textContent = `${backgroundBlurSlider.value}px`;
    // Populate Background Opacity Slider and update its value display span
    backgroundOpacitySlider.value = settings.backgroundOpacity !== undefined ? settings.backgroundOpacity : 0.5;
    backgroundOpacityValueSpan.textContent = backgroundOpacitySlider.value;

    // Populate Weather Settings inputs
    weatherLocationInput.value = settings.weather?.location || ''; // Use optional chaining for safety
    weatherApiKeyInput.value = settings.weather?.apiKey || '';
    weatherUnitSelect.value = settings.weather?.unit || 'metric'; // Default to 'metric'
    // Populate other settings form elements here as you add them...
}

// Gets the current values from the settings form inputs in the settings panel.
// This function reads the UI elements and returns an object containing their values.
// It specifically collects values from the form inputs, NOT from the global dashboardSettings object.
function getSettingsFromForm() {
    console.log("Getting settings from form inputs.");
    const settingsFromForm = {
        welcomeMessage: welcomeMessageInput.value.trim(), // Get the trimmed value from the welcome message input
        // Get the selected background file name from the dropdown's value
        backgroundFile: backgroundSelect.value,
        // Get values from sliders and ensure they are the correct number types
        backgroundBlur: parseInt(backgroundBlurSlider.value, 10), // Parse blur value as integer
        backgroundOpacity: parseFloat(backgroundOpacitySlider.value), // Parse opacity value as float
        // Get Weather Settings from inputs
        weather: {
            location: weatherLocationInput.value.trim(), // Get trimmed location
            apiKey: weatherApiKeyInput.value.trim(), // Get trimmed API key
            unit: weatherUnitSelect.value // Get selected unit value
        }
        // Get values for other settings from their form elements here...
    };
    // This object contains ONLY the values read directly from the form elements.
    return settingsFromForm;
}

// Function triggered by the Save Settings button in the settings panel.
// This function orchestrates collecting form data, merging it into global settings, saving, and updating the UI.
async function saveSettingsFromPanel() {
     console.log("Save Settings button clicked. Saving settings from panel.");
     // Get the latest settings values directly from the form inputs
     const settingsFromForm = getSettingsFromForm();

     // *** Merge the settings from the form into the global dashboardSettings object ***
     // This is the critical step where the form's values update the main state.
     // We start with the current global settings to preserve properties not in the form (like activeWidgets and widgets data).
     // Then, we overwrite properties with the values collected from the form.
     // A deep merge is used for nested objects like 'weather'.
     dashboardSettings = {
         ...dashboardSettings, // Start with the current global state
         ...settingsFromForm, // Overwrite top-level properties with form values (includes welcomeMessage, backgroundFile, backgroundBlur, backgroundOpacity)
         weather: { // Deep merge the weather object
             ...dashboardSettings.weather, // Start with the current weather settings
             ...settingsFromForm.weather // Overwrite/add properties from the weather form inputs
         },
         // Explicitly ensure 'activeWidgets' and 'widgets' properties are carried over from the previous state.
         // This prevents them from being lost if getSettingsFromForm didn't include them.
         activeWidgets: dashboardSettings.activeWidgets || [], // Use existing array or default to empty
         widgets: dashboardSettings.widgets || {} // Use existing object or default to empty
     };

     // *** Save the entire updated dashboardSettings object to electron-store via IPC ***
     // This also triggers the 'settings-updated' IPC message from the main process,
     // which in turn calls applySettings() in the renderer.
     await saveDashboardSettings();

     // Because the main process sends back the updated settings via 'settings-updated'
     // which triggers applySettings(), calling applySettings() directly here is redundant
     // unless you need UI updates immediately before the IPC round trip completes.
     // applySettings(); // Optional call here

     // Hide the settings panel after the save process has been initiated
     hideSettingsPanel();
     console.log("Finished saving settings from panel.");
}

// Attach listener to the Save Settings button in the panel
saveSettingsBtn.addEventListener('click', saveSettingsFromPanel);
// Attach listener to the Cancel Settings button in the panel
cancelSettingsBtn.addEventListener('click', hideSettingsPanel);


// New: Populate Background Select Dropdown
// This function populates the <select> element in the settings panel
// with options based on the availableBackgrounds array.
function populateBackgroundSelect(selectedFileName) {
     console.log("Populating background select. Selected:", selectedFileName);
     // Clear any existing <option> elements in the dropdown
     backgroundSelect.innerHTML = '';
     // Loop through the list of predefined available backgrounds
     availableBackgrounds.forEach(bg => {
         const option = document.createElement('option'); // Create a new <option> element
         option.value = bg.name; // Set the option's value to the background's filename
         option.textContent = bg.name; // Set the text displayed in the dropdown to the filename
         // If this background's name matches the currently selected file name from settings, mark this option as selected
         if (bg.name === selectedFileName) {
             option.selected = true;
         }
         // Append the newly created option to the select dropdown
         backgroundSelect.appendChild(option);
     });
      // Add a special option for "None" to allow having no background selected
     const noneOption = document.createElement('option');
     noneOption.value = ''; // Use an empty string as the value for no background
     noneOption.textContent = 'None'; // Display "None"
     // If the current selectedFileName is falsy (empty string, null, or undefined), select the 'None' option
     if (!selectedFileName) {
         noneOption.selected = true;
     }
     // Add the 'None' option to the beginning of the dropdown list
     backgroundSelect.prepend(noneOption);

     console.log("Background select populated.");
}


// Remove Handle Background Video File Selection
// The event listener for the file input is no longer used in this version and should be removed.
// Ensure the element reference 'backgroundFileInput' is also removed if it was global.
// const backgroundFileInput = document.getElementById('background-file-input');
// if (backgroundFileInput) {
//      backgroundFileInput.addEventListener('change', (event) => { /* ... REMOVE THIS ... */ });
// }


// --- Widget Selection Panel Logic ---
// Functions to control the display and interaction of the widget selection panel modal.

// Shows the widget selection panel
function showWidgetSelectionPanel() {
    console.log("Showing widget selection panel.");
    // Populate the list of available widgets before showing the panel
    populateWidgetList();
    // Add the 'visible' class to show the panel (handled by CSS)
    widgetSelectionPanel.classList.add('visible');
}

// Hides the widget selection panel
function hideWidgetSelectionPanel() {
    console.log("Hiding widget selection panel.");
    // Remove the 'visible' class to hide the panel (handled by CSS)
    widgetSelectionPanel.classList.remove('visible');
}

// Populates the <ul> list in the widget selection panel with available widget types.
function populateWidgetList() {
    console.log("Populating widget list.");
    widgetListUl.innerHTML = ''; // Clear any existing list items
    // Loop through the defined widget types in the widgetTypes object
    for (const type in widgetTypes) {
        const li = document.createElement('li'); // Create a new list item
        li.textContent = widgetTypes[type].title; // Set the list item's text to the widget's display title
        li.dataset.widgetType = type; // Store the widget type key in a data attribute (e.g., data-widget-type="clock")
        // Attach a click listener to the list item
        li.addEventListener('click', handleWidgetSelection); // When clicked, call handleWidgetSelection
        widgetListUl.appendChild(li); // Add the list item to the <ul>
    }
    console.log("Widget list populated.");
}

// Handles a click on a widget type in the selection list.
// Adds the selected widget to the dashboard.
function handleWidgetSelection(event) {
    // Get the widget type key from the data attribute of the clicked list item
    const widgetType = event.target.dataset.widgetType;
    console.log(`Widget type "${widgetType}" selected from list.`);
    if (widgetType) {
        addWidget(widgetType); // Call addWidget to add the selected type (creates a new instance)
        hideWidgetSelectionPanel(); // Hide the selection panel after adding
         console.log(`Added widget type: ${widgetType}`);
    }
}

// Attach listener to the Cancel Add Widget button
cancelAddWidgetBtn.addEventListener('click', hideWidgetSelectionPanel);


// --- Ambient Background Control ---
// This function is primarily for initial setup if needed.
// The main logic for setting background src and styles is in applySettings.
function initBackgroundControl() {
     console.log('Background control initialized.');
     // The initial background src and styles are set by applySettings when dashboardSettings are loaded on startup.
     // No need to set background here directly.
}


// --- Music Integration (Conceptual) ---
// Placeholder function for future music player integration.
function initMusicPlayer() {
    console.log('Music player initialization (conceptual)');
    // Add music player initialization logic here if you implement it.
}


// --- Initialize Dashboard ---
// The main asynchronous function that runs when the renderer process script starts loading.
// It orchestrates the loading of settings and rendering the initial dashboard state.
async function initializeDashboard() {
    console.log('Initializing dashboard...');

    // Load settings from electron-store via IPC
    // Check if the electronAPI and loadSettings method are available
    if (window.electronAPI && typeof window.electronAPI.loadSettings === 'function') {
        try {
            // Await the result of the load-settings IPC handler in the main process
            dashboardSettings = await window.electronAPI.loadSettings();
            console.log('Settings loaded successfully:', dashboardSettings);

             // *** Load active widgets from settings ***
             // Get the activeWidgets array from the loaded settings. Default to an empty array if it's missing or not an array.
            activeWidgets = Array.isArray(dashboardSettings.activeWidgets) ? dashboardSettings.activeWidgets : [];
             // Ensure the 'widgets' object exists in dashboardSettings for storing widget-specific data (like To-Do items). Default to an empty object if missing.
             dashboardSettings.widgets = dashboardSettings.widgets || {};

             // *** Ensure backgroundFile key exists and set default if not set ***
             // This handles cases where settings might not have this key yet (e.g., first run or upgrading from older settings).
            if (!dashboardSettings.backgroundFile) {
                 // Set the default background file name to the first available background's name if any are defined, otherwise use an empty string.
                 dashboardSettings.backgroundFile = availableBackgrounds.length > 0 ? availableBackgrounds[0].name : '';
                 console.log("Background file not set in loaded settings. Defaulting to:", dashboardSettings.backgroundFile || 'None');
             }

        } catch (error) {
            // Handle errors during settings loading (e.g., file read error, parsing error)
            console.error('Failed to load settings:', error);
             // If loading fails, initialize dashboardSettings with default values
             dashboardSettings = {
                 weather: { location: 'London', apiKey: '', unit: 'metric' },
                 activeWidgets: [], // Start with no active widgets on load failure
                 widgets: {}, // Start with empty widgets data
                 welcomeMessage: 'Welcome to Chill Pulse!', // Default welcome message
                 backgroundFile: availableBackgrounds[0]?.name || '', // Default background name (first available or empty)
                 backgroundBlur: 10, // Default blur
                 backgroundOpacity: 0.5 // Default opacity
             };
             activeWidgets = []; // Ensure activeWidgets array is empty
             dashboardSettings.widgets = {}; // Ensure widgets object exists
             console.log('Using default settings due to load failure:', dashboardSettings);
             alert('Failed to load settings. Using default settings.'); // Inform the user
        }
    } else {
        // This block executes if window.electronAPI or loadSettings method is NOT available (e.g., running outside Electron).
        console.warn('electronAPI.loadSettings not available. Using default settings.');
         // Initialize dashboardSettings with default values
         dashboardSettings = {
             weather: { location: 'London', apiKey: '', unit: 'metric' },
             activeWidgets: [], // Start with no active widgets
             widgets: {}, // Start with empty widgets data
             welcomeMessage: 'Welcome to Chill Pulse!',
             backgroundFile: availableBackgrounds[0]?.name || '', // Default background name
             backgroundBlur: 10,
             backgroundOpacity: 0.5
         };
         activeWidgets = [];
         dashboardSettings.widgets = {};
    }

    // *** Apply the initial settings immediately after loading or setting defaults ***
    applySettings();

    // Initialize global elements and conceptual features
    initBackgroundControl(); // Initialize background control (sets background based on applied settings)
    initMusicPlayer(); // Initialize music player (conceptual)

    // *** Render the widgets that were loaded from settings ***
    renderActiveWidgets();

    console.log('Dashboard initialization complete.');
}

// Start the dashboard initialization process when the renderer script begins executing.
initializeDashboard();