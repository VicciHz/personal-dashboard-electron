// widgets/pomodoroWidget.js

// Initializes a single Pomodoro Timer widget instance
// Takes element IDs, widget ID, and the exposed electronAPI for notifications.
export function initPomodoroWidget(widgetId, timerElementId, startBtnId, pauseBtnId, resetBtnId, statusElementId, electronAPI) {
    // Get references to the specific elements for this widget instance using provided IDs
    const pomodoroWidgetElement = document.getElementById(`widget-${widgetId}`); // Get the main widget container element (for state classes)
    const pomodoroTimerElement = document.getElementById(timerElementId); // Element displaying the timer countdown
    const startPomodoroBtn = document.getElementById(startBtnId); // Button to start/resume the timer
    const pausePomodoroBtn = document.getElementById(pauseBtnId); // Button to pause the timer
    const resetPomodoroBtn = document.getElementById(resetBtnId); // Button to reset the timer
    const pomodoroStatusElement = document.getElementById(statusElementId); // Element displaying the current status (Working, Break, Ready)

    // --- Basic validation for elements ---
    // Check if all necessary elements were found
     if (!pomodoroWidgetElement || !pomodoroTimerElement || !startPomodoroBtn || !pausePomodoroBtn || !resetPomodoroBtn || !pomodoroStatusElement) {
         console.error(`Pomodoro elements not found for widget ${widgetId}. Initialization failed.`);
         // Return a dummy cleanup function if initialization failed
         return null; // Indicate initialization failure
     }

    // --- Local State for this Widget Instance ---
    // Define standard Pomodoro durations in seconds
    const POMODORO_DURATION = 25 * 60; // 25 minutes
    const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes
    const LONG_BREAK_DURATION = 15 * 60; // 15 minutes
    // Define how many Pomodoros until a long break
    const CYCLES_UNTIL_LONG_BREAK = 4;

    let timerInterval = null; // Variable to hold the interval ID for the timer
    let timeLeft = POMODORO_DURATION; // Time remaining in the current session (starts as Pomodoro duration)
    let isRunning = false; // Boolean to track if the timer is currently running
    let currentMode = 'pomodoro'; // Current mode: 'pomodoro', 'short-break', 'long-break'
    let completedCycles = 0; // Counter for completed Pomodoro cycles


    // --- Helper Functions for Timer Logic ---

    // Updates the timer display element with the current timeLeft
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60); // Calculate remaining minutes
        const seconds = timeLeft % 60; // Calculate remaining seconds
        // Format the display with leading zeros and update the element
        pomodoroTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Starts or resumes the timer countdown
    function startTimer() {
        if (isRunning) return; // Do nothing if the timer is already running

        isRunning = true; // Set running state to true
        // Disable the Start button and enable Pause/Reset buttons
        startPomodoroBtn.disabled = true;
        pausePomodoroBtn.disabled = false;
        resetPomodoroBtn.disabled = false;

        // Update status text and add CSS classes based on the current mode
        pomodoroWidgetElement.classList.remove('working', 'breaking'); // Remove previous state classes
        if (currentMode === 'pomodoro') {
             pomodoroStatusElement.textContent = 'Working';
             pomodoroWidgetElement.classList.add('working'); // Add 'working' class for styling
        } else {
             pomodoroStatusElement.textContent = `${currentMode === 'short-break' ? 'Short Break' : 'Long Break'}`;
             pomodoroWidgetElement.classList.add('breaking'); // Add 'breaking' class for styling
        }

        // Set up the interval to decrement timeLeft every second (1000ms)
        timerInterval = setInterval(() => {
            timeLeft--; // Decrement time left
            updateTimerDisplay(); // Update the UI display

            if (timeLeft <= 0) { // If time is up
                clearInterval(timerInterval); // Clear the interval
                isRunning = false; // Set running state to false
                handleTimerEnd(); // Call the function to handle the end of the session
            }
        }, 1000); // Interval runs every 1000ms (1 second)
    }

    // Pauses the timer countdown
    function pauseTimer() {
        if (!isRunning) return; // Do nothing if the timer is not running

        isRunning = false; // Set running state to false
        clearInterval(timerInterval); // Clear the countdown interval
        // Enable the Start button and disable the Pause button
        startPomodoroBtn.disabled = false;
        pausePomodoroBtn.disabled = true;
        // Update status text to indicate paused state
        pomodoroStatusElement.textContent = `${currentMode === 'pomodoro' ? 'Paused Work' : 'Paused Break'}`;
        // Remove state classes from the widget element
        pomodoroWidgetElement.classList.remove('working', 'breaking');
    }

    // Resets the timer to the initial Pomodoro state (25:00, Ready)
    function resetTimer() {
        clearInterval(timerInterval); // Clear any active interval
        isRunning = false; // Set running state to false
        // Enable the Start button and disable Pause/Reset buttons
        startPomodoroBtn.disabled = false;
        pausePomodoroBtn.disabled = true;
        resetPomodoroBtn.disabled = true; // Reset button is enabled by start/pause
        completedCycles = 0; // Reset cycle count
        currentMode = 'pomodoro'; // Reset mode to pomodoro
        timeLeft = POMODORO_DURATION; // Reset time left to Pomodoro duration
        updateTimerDisplay(); // Update the UI display to the reset time
        pomodoroStatusElement.textContent = 'Ready'; // Update status text
        // Remove state classes from the widget element
        pomodoroWidgetElement.classList.remove('working', 'breaking');
    }

    // Handles the logic when a timer session ends (timeLeft reaches 0)
    function handleTimerEnd() {
        console.log(`${currentMode} session ended for widget ${widgetId}.`);
        // *** Trigger Native Notification using the passed electronAPI ***
        // Check if electronAPI and the showNotification method are available
        if (electronAPI && typeof electronAPI.showNotification === 'function') {
            const notificationTitle = currentMode === 'pomodoro' ? 'Pomodoro Complete!' : 'Break Complete!';
            const notificationBody = currentMode === 'pomodoro' ?
                (completedCycles % CYCLES_UNTIL_LONG_BREAK === CYCLES_UNTIL_LONG_BREAK - 1 ? 'Start your long break.' : 'Start your short break.') : // Check if the completed cycle was the last before a long break
                'Time to work!';
            // Call the exposed showNotification function
            electronAPI.showNotification(notificationTitle, notificationBody);
        } else {
           console.warn('Native notifications not available or exposed. Using alert fallback.');
           alert(`${currentMode === 'pomodoro' ? 'Pomodoro Complete!' : 'Break Complete!'}`); // Fallback alert
        }


        // Logic to transition to the next mode (break or work)
        if (currentMode === 'pomodoro') {
            completedCycles++; // Increment completed Pomodoro cycles
            // Check if it's time for a long break
            if (completedCycles % CYCLES_UNTIL_LONG_BREAK === 0) {
                currentMode = 'long-break'; // Set mode to long break
                timeLeft = LONG_BREAK_DURATION; // Set time for long break
                console.log(`Completed ${completedCycles} cycles. Starting long break.`);
            } else {
                currentMode = 'short-break'; // Set mode to short break
                timeLeft = SHORT_BREAK_DURATION; // Set time for short break
                 console.log(`Completed ${completedCycles} cycles. Starting short break.`);
            }
            startTimer(); // Automatically start the break timer
        } else { // If a break session just finished (short or long)
            currentMode = 'pomodoro'; // Reset mode to pomodoro (work)
            timeLeft = POMODORO_DURATION; // Set time for the next work session
            pomodoroStatusElement.textContent = 'Ready'; // Update status text
            updateTimerDisplay(); // Update the UI display to the next mode's time (25:00)
            // Enable Start button for the next work cycle and disable Pause button
            startPomodoroBtn.disabled = false;
            pausePomodoroBtn.disabled = true;
            resetPomodoroBtn.disabled = false; // Allow resetting before starting the next work
             pomodoroWidgetElement.classList.remove('working', 'breaking'); // Remove state classes
             console.log('Break finished. Ready for next Pomodoro.');
        }
    }

    // --- Event Listeners ---
    // Add click listeners to the control buttons to call the respective functions
    startPomodoroBtn.addEventListener('click', startTimer);
    pausePomodoroBtn.addEventListener('click', pauseTimer);
    resetPomodoroBtn.addEventListener('click', resetTimer);


    // --- Initial Display ---
    updateTimerDisplay(); // Display the initial time (25:00) when the widget is initialized


    // *** Return a Cleanup Function ***
    // This function will be called by renderer.js when this widget instance is removed.
    // It's crucial to clear the interval and remove event listeners to prevent memory leaks.
    return () => {
        console.log(`Pomodoro widget cleanup started for ID: ${widgetId}`);
        // Clear the countdown interval if it's active
        clearInterval(timerInterval);
        // Remove event listeners added with addEventListener
        startPomodoroBtn.removeEventListener('click', startTimer);
        pausePomodoroBtn.removeEventListener('click', pauseTimer);
        resetPomodoroBtn.removeEventListener('click', resetTimer);
        console.log(`Pomodoro timer and listeners cleared for widget ID: ${widgetId}`);
        // Add any other cleanup needed here
    };
}