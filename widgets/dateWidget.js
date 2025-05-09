// widgets/dateWidget.js

// Initializes a single Date widget instance
// Takes the ID of the HTML element where the date should be displayed.
export function initDateWidget(elementId) {
    // Get the specific HTML element for this widget instance
    const dateElement = document.getElementById(elementId);

    // Basic validation: check if the element was found
     if (!dateElement) {
        console.error(`Date element not found: ${elementId}. Widget initialization failed.`);
         // Return a dummy cleanup function if the element doesn't exist
         return () => { console.warn(`Cleanup called for failed Date widget ${elementId}`); };
    }

    // Function to update the date display in the element
    function updateDateDisplay() {
        const now = new Date(); // Get the current date
        // Define options for date formatting
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        // Format the date using the browser's locale and options, then update the element
        dateElement.textContent = now.toLocaleDateString(undefined, options);
    }

    // Set up an interval to update the date display (e.g., every minute or hour is sufficient)
    // Updating every minute (60 * 1000 ms)
    const intervalId = setInterval(updateDateDisplay, 60 * 1000); // Update every minute

    // Perform an initial update immediately
    updateDateDisplay();

    // *** Return a cleanup function ***
    // Clears the interval when the widget is removed.
    return () => {
        clearInterval(intervalId); // Clear the interval
        console.log(`Date interval cleared for element ID: ${elementId}`);
    };
}