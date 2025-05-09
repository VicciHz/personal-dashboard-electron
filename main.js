// main.js

// Import necessary modules from Electron
const { app, BrowserWindow, ipcMain, Notification, clipboard } = require('electron');
// Import Node.js path module for handling file paths
const path = require('path');
// Import electron-store for persistent storage of settings
const Store = require('electron-store');

// Initialize electron-store
const store = new Store();

// Function to create the main application window
const createWindow = () => {
  // Create a new browser window instance
  const mainWindow = new BrowserWindow({
    width: 1000, // Set the initial width
    height: 700, // Set the initial height
    frame: false, // Make the window frameless (removes native window title bar)
    transparent: true, // Make the window transparent (allows seeing through to the desktop or background)
    webPreferences: {
      // Set the preload script path. This script runs before the renderer process HTML loads.
      // It's used to expose APIs securely from the main process to the renderer.
      preload: path.join(__dirname, 'preload.js'),
      // Enable context isolation. This is a security feature that prevents the renderer
      // process from directly accessing Node.js APIs or the preload script's internals.
      contextIsolation: true,
      // Disable node integration. This prevents the renderer process from having direct
      // access to Node.js APIs like 'require'. Recommended for security.
      nodeIntegration: false,
    },
  });

  // Load the index.html file into the main window
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools automatically (useful for debugging)
  // **Commented out:** Uncomment this line if you need to debug and want DevTools to open on startup.
  // mainWindow.webContents.openDevTools();
};

// *** Application Lifecycle Events ***

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow(); // Create the main window when the app is ready

  // *** IPC Handlers: Handle requests from the renderer process ***
  // These are set up *after* app.whenReady and before or just after createWindow.

  // Window Controls IPC Handlers
  ipcMain.on('set-always-on-top', (event, isAlwaysOnTop) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.setAlwaysOnTop(isAlwaysOnTop); // Safely set always on top
  });
  ipcMain.on('minimize-window', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.minimize(); // Safely minimize the window
  });
  ipcMain.on('maximize-window', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
          if (win.isMaximized()) {
              win.unmaximize(); // Restore if maximized
          } else {
              win.maximize(); // Maximize if not
          }
      }
  });
  ipcMain.on('close-window', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.close(); // Safely close the window
  });

  // To-Do IPC Handler (Only load is actively used by the current renderer structure)
  // The saveTodos handler is likely not needed anymore as To-Dos are saved as part of global settings
  // ipcMain.on('save-todos', (event, todos) => { ... });
  // Handle requests from renderer to load todos
  ipcMain.handle('load-todos', async () => {
    // Load 'todos' data from the store, defaulting to an empty array if not found
    const todos = store.get('todos', []);
    console.log('Loading todos:', todos);
    return todos; // Return the loaded todos back to the renderer
  });

  // General Settings IPC Handlers
  // Handle requests from renderer to save the complete settings object
  ipcMain.on('save-settings', (event, settings) => {
      console.log('Saving settings:', settings);
      // Save the received settings object to the store
      store.set('settings', settings);
       // *** IMPORTANT: Notify the renderer that settings have been updated ***
       // This triggers the 'settings-updated' listener in renderer.js
       event.sender.send('settings-updated', settings); // Send the saved settings back
  });

  // Handle requests from renderer to load settings
  ipcMain.handle('load-settings', async () => {
      // Define the default structure for settings
      const defaultSettings = {
          welcomeMessage: 'Welcome to Chill Pulse!', // Default welcome message
          // Default background file name (must match a file in assets/ and an entry in availableBackgrounds)
          backgroundFile: 'background.mp4',
          backgroundBlur: 10, // Default blur value
          backgroundOpacity: 0.5, // Default opacity value
          weather: { // Default weather settings structure
              location: 'London', // Default location
              apiKey: '', // Default empty API key
              unit: 'metric' // Default unit
          },
          activeWidgets: [], // Default empty array for active widgets
          widgets: {} // Default empty object for widget-specific data (like To-Dos)
      };

      // Load existing settings from the store, defaulting to an empty object if none exist
      const userSettings = store.get('settings', {});

      // Deep merge default settings with user settings
      // This ensures all keys are present and user settings override defaults where they exist
      const mergedSettings = {
          ...defaultSettings, // Start with all default settings
          ...userSettings, // Override with any user-saved settings
          weather: { // Deep merge weather settings specifically
              ...defaultSettings.weather, // Start with default weather settings
              ...userSettings.weather // Override/add weather settings from user data
          },
           // Explicitly ensure activeWidgets and widgets are carried over from user settings if they exist
           activeWidgets: Array.isArray(userSettings.activeWidgets) ? userSettings.activeWidgets : defaultSettings.activeWidgets,
           widgets: userSettings.widgets || defaultSettings.widgets
      };

      console.log('Loading settings:', mergedSettings);
      return mergedSettings; // Return the merged settings to the renderer
  });

  // Notification IPC Handler (for desktop notifications)
  ipcMain.on('show-notification', (event, { title, body }) => {
      // Check if desktop notifications are supported on the current OS
      if (Notification.isSupported()) {
          new Notification({ title, body }).show(); // Show the notification
      } else {
          console.log('Desktop notifications not supported on this operating system.');
      }
  });

  // New: IPC Handler to read clipboard text
  // This is an 'invoke' handler because the renderer is requesting data and expecting a response
  ipcMain.handle('read-clipboard-text', async () => {
      // Use Electron's built-in clipboard module to read text
      const text = clipboard.readText();
      console.log('Reading clipboard text:', text);
      return text; // Return the clipboard text
  });

  // The IPC handler for processing background files was removed as we now use predefined assets.
  // ipcMain.on('process-background-file', (event, originalFilePath) => { ... });


}); // <--- This brace and parenthesis correctly close the app.whenReady().then() block


// *** Standard Electron Application Events ***

// Quit when all windows are closed, except on macOS.
// On macOS it's common for applications and their menu bar to stay active
// until the user quits explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { // If not macOS
    app.quit(); // Quit the application
  }
}); // <--- This brace and parenthesis correctly close the window-all-closed block handler

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
// This handler ensures a window is created if none exist when the app is activated.
// **This logic correctly prevents creating a duplicate window if one already exists.**
app.on('activate', () => {
  // If there are no browser windows currently open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(); // Create a new window
  }
}); // <--- This brace and parenthesis correctly close the activate block handler

// In this file you can include the rest of your app's specific main process code.
// You can also put them in separate files and require them here.