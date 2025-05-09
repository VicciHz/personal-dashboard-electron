// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window Controls API
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  setAlwaysOnTop: (isAlwaysOnTop) => ipcRenderer.send('set-always-on-top', isAlwaysOnTop),


  // To-Do List API
  // saveTodos: (todos) => ipcRenderer.send('save-todos', todos), // Removed - To-Do widget saves via main settings now
  loadTodos: () => ipcRenderer.invoke('load-todos'), // Still needed for initial load if not saving full state

  // General Settings API
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (event, settings) => callback(settings)),

  // Notification API
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  // Remove the Background File Processing API
  // processBackgroundFile: (filePath) => ipcRenderer.send('process-background-file', filePath),
});