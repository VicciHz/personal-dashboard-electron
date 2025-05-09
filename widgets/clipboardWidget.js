// widgets/clipboardWidget.js

// Initializes a single Clipboard widget instance
// Takes the ID of the HTML element to display content, widget ID, dashboardSettings (if needed), and the exposed electronAPI.
export function initClipboardWidget(elementId, widgetId, dashboardSettings, electronAPI) {
    // Get reference to the specific HTML element for this widget instance where clipboard content will be displayed
    const clipboardContentElement = document.getElementById(elementId);

     // --- Basic validation for elements ---
     // Check if the necessary display element was found
    if (!clipboardContentElement) {
         console.error(`Clipboard content element not found for widget ${widgetId}. Initialization failed.`);
         // Return a dummy cleanup function if the element doesn't exist to prevent errors later
         return () => { console.warn(`Cleanup called for failed Clipboard widget ${widgetId}`); };
    }

    // --- Function to fetch and update clipboard content ---
    // This function uses the exposed electronAPI to read the system clipboard.
    async function updateClipboardContent() {
        console.log(`Attempting to read clipboard for widget ${widgetId}`);
        // Check if electronAPI is available and if the 'readClipboardText' function was successfully exposed by the preload script.
        if (electronAPI && typeof electronAPI.readClipboardText === 'function') {
            try {
                // Call the exposed function (which uses ipcRenderer.invoke) to request the clipboard text from the main process.
                // Await the result, as ipcRenderer.invoke is asynchronous.
                const text = await electronAPI.readClipboardText();
                // Display the retrieved text content in the widget's element.
                // If the text is empty or null, display a message indicating the clipboard is empty or contains non-text data.
                clipboardContentElement.textContent = text || 'Clipboard is empty or contains non-text data.';
                console.log(`Clipboard content updated for widget ${widgetId}`);
            } catch (error) {
                // Handle any errors that occur during the IPC call or clipboard reading process.
                console.error('Failed to read clipboard via electronAPI:', error);
                // Display an error message in the widget.
                clipboardContentElement.textContent = 'Error reading clipboard.';
            }
        } else {
            // This block executes if electronAPI or the exposed function is not available.
            // This usually indicates an issue with the preload script or context bridge setup.
            clipboardContentElement.textContent = 'Clipboard access not available via API.';
            console.error('electronAPI.readClipboardText not exposed to the renderer.');
        }
    }

    // --- Initial Display ---
    // Call the update function immediately when the widget is initialized
    // to display the current clipboard content on load.
    updateClipboardContent();

    // --- Optional: Add a manual refresh button (requires HTML addition) ---
    // If you add a button with a unique ID (e.g., #refresh-clipboard-btn-${widgetId}) in the widget's getHtml,
    // you could add a listener here to call updateClipboardContent() when clicked.
    // const refreshButton = document.getElementById(`refresh-clipboard-btn-${widgetId}`);
    // if (refreshButton) {
    //     // Add click listener to the refresh button
    //     refreshButton.addEventListener('click', updateClipboardContent);
    //     // Return a cleanup function that specifically removes this listener
    //     return () => {
    //          refreshButton.removeEventListener('click', updateClipboardContent);
    //          console.log(`Clipboard refresh listener removed for widget ${widgetId}`);
    //     };
    // }


    // --- Cleanup Function ---
    // Returns a function that will be called by renderer.js when this widget instance is removed.
    // In this basic version, there are no intervals or complex listeners that require cleanup beyond the optional refresh button.
    // If you add features like polling the clipboard periodically, the interval must be cleared here.
    return () => {
         console.log(`Clipboard widget cleanup completed for ID: ${widgetId}`);
         // Add any cleanup needed here later (e.g., clearInterval for polling)
    };
}