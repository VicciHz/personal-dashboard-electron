// widgets/clockWidget.js

// Initializes a single Clock widget instance
// Takes the ID of the HTML element where the time should be displayed.
export function initClockWidget(elementId) {
    // Get the specific HTML element for this widget instance
    const timeElement = document.getElementById(elementId);

    // Basic validation: check if the element was found
    if (!timeElement) {
        console.error(`Clock element not found: ${elementId}. Widget initialization failed.`);
        // Return a dummy cleanup function if the element doesn't exist
        return () => { console.warn(`Cleanup called for failed Clock widget ${elementId}`); };
    }

    // Function to update the time display in the element
    function updateClockDisplay() {
        const now = new Date(); // Get the current date and time
        // Format hours, minutes, and seconds with leading zeros
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        // Update the text content of the element
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Set up an interval to update the clock display every second (1000ms)
    // Store the interval ID so it can be cleared later.
    const intervalId = setInterval(updateClockDisplay, 1000);

    // Perform an initial update immediately so the clock shows the time right away
    updateClockDisplay();

    // *** Return a cleanup function ***
    // This function will be called by renderer.js when the widget is removed.
    // It clears the interval to stop the clock updates for this specific instance.
    return () => {
        clearInterval(intervalId); // Clear the interval using its ID
        console.log(`Clock interval cleared for element ID: ${elementId}`);
    };
}