// widgets/todoWidget.js

// Initializes a single To-Do List widget instance
// Takes element IDs, widget ID, the global dashboardSettings object, and a save function from renderer.js.
export function initTodosWidget(inputElementId, addButtonId, listElementId, widgetId, dashboardSettings, saveSettingsFn) {
    // Get references to the specific elements for this widget instance using provided IDs
    const newTodoInput = document.getElementById(inputElementId); // Input field for new todos
    const addTodoBtn = document.getElementById(addButtonId); // Button to add todo
    const todoListUl = document.getElementById(listElementId); // <ul> element to display todos

    // --- Basic validation for elements ---
    // Check if all necessary elements were found in the DOM
    if (!newTodoInput || !addTodoBtn || !todoListUl) {
         console.error(`To-Do elements not found for widget ${widgetId}. Initialization failed.`);
         // Return a dummy cleanup function to avoid errors if this init failed
         return () => { console.warn(`Cleanup called for failed To-Do widget ${widgetId}`); };
    }

    // --- Load/Initialize Widget Data ---
    // Ensure the necessary nested structure for widget-specific data exists in dashboardSettings.
    // dashboardSettings.widgets is the object holding data for all widget instances by their ID.
    dashboardSettings.widgets = dashboardSettings.widgets || {}; // If 'widgets' object doesn't exist, create it
    // Ensure the object for this specific widget ID exists within dashboardSettings.widgets
    dashboardSettings.widgets[widgetId] = dashboardSettings.widgets[widgetId] || {};
    // Load the todos array for this specific widget instance from dashboardSettings.
    // Default to an empty array if 'todos' doesn't exist for this widget ID.
    let todos = dashboardSettings.widgets[widgetId].todos || [];


    // --- Helper Functions for To-Do Logic ---

    // Renders the current list of todos from the 'todos' array to the UI.
    function renderTodos() {
        todoListUl.innerHTML = ''; // Clear the current list display in the UI
        // Loop through each todo item in the 'todos' array
        todos.forEach((todo, index) => {
            const li = document.createElement('li'); // Create a new <li> element for the todo item
            // Add/remove the 'completed' CSS class based on the todo's completed state for styling
            li.classList.toggle('completed', todo.completed);

            const todoText = document.createElement('span'); // Create a span for the todo text
            todoText.textContent = todo.text; // Set the text content

            const actionsDiv = document.createElement('div'); // Container for action buttons
            actionsDiv.classList.add('todo-actions'); // Add class for styling

            const completeBtn = document.createElement('button'); // Button to toggle completed state
            completeBtn.textContent = todo.completed ? 'Undo' : 'Complete'; // Set button text dynamically
            completeBtn.classList.add('complete-btn');
            // Add a click listener to call toggleTodoComplete for this item's index
            // Using .onclick here for simplicity; remember to set to null in cleanup.
            completeBtn.onclick = () => toggleTodoComplete(index);

            const deleteBtn = document.createElement('button'); // Button to delete the todo
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
            // Add a click listener to call deleteTodo for this item's index
            deleteBtn.onclick = () => deleteTodo(index); // Using .onclick

            // Append the buttons to the actions container
            actionsDiv.appendChild(completeBtn);
            actionsDiv.appendChild(deleteBtn);

            // Append the todo text and actions container to the list item
            li.appendChild(todoText);
            li.appendChild(actionsDiv);

            // Append the completed list item to the main To-Do list UL
            todoListUl.appendChild(li);
        });
        // *** Trigger saving after rendering ***
        // This ensures that whenever the UI is updated (after add, toggle, delete), the state is saved.
        saveTodosForInstance();
         console.log(`To-Do list rendered and saved for widget ${widgetId}. Current todos:`, todos);
    }

    // Adds a new todo item based on the input field's content.
    function addTodo() {
        const text = newTodoInput.value.trim(); // Get the trimmed text from the input field
        if (text) { // Only proceed if the text is not empty after trimming
            todos.push({ text: text, completed: false }); // Add a new todo object (text and initial completed state) to the 'todos' array
            newTodoInput.value = ''; // Clear the input field
            renderTodos(); // Re-render the list to show the new item and trigger save
        }
    }

    // Toggles the 'completed' state of a todo item at a given index.
    function toggleTodoComplete(index) {
        // Check if an item exists at the given index in the 'todos' array
        if (todos[index]) {
            todos[index].completed = !todos[index].completed; // Toggle the boolean value of 'completed'
            renderTodos(); // Re-render the list to update the UI and trigger save
        }
    }

    // Deletes a todo item at a given index.
    function deleteTodo(index) {
        // Check if an item exists at the given index in the 'todos' array
        if (todos[index]) {
            todos.splice(index, 1); // Remove the item from the 'todos' array using splice
            renderTodos(); // Re-render the list to update the UI and trigger save
        }
    }

    // *** Function to Save To-Dos for this specific widget instance ***
    // This function updates the local copy of todos within the global dashboardSettings object
    // and then calls the save function passed from renderer.js.
    function saveTodosForInstance() {
        // Update the 'todos' array specifically for this widget instance within the global dashboardSettings object.
        // Ensure the necessary structure exists before assigning.
        dashboardSettings.widgets = dashboardSettings.widgets || {};
        dashboardSettings.widgets[widgetId] = dashboardSettings.widgets[widgetId] || {};
        dashboardSettings.widgets[widgetId].todos = todos; // Assign the current 'todos' array

        // *** Call the main save settings function passed from renderer.js ***
        // This function (which is saveDashboardSettings in renderer.js) is responsible for
        // sending the entire dashboardSettings object to the main process for persistent storage.
        if (typeof saveSettingsFn === 'function') {
              saveSettingsFn(); // Call the save function. It will save the entire dashboardSettings object.
              // console.log(`Called saveSettingsFn for widget ${widgetId}`); // Debugging log
        } else {
            // Log an error if the save function was not provided during initialization
            console.error('Save settings function not provided to To-Do widget. Data may not be saved.');
        }
    }


    // --- Event Listeners ---
    // Add a click listener to the Add button to call addTodo when clicked
    addTodoBtn.addEventListener('click', addTodo);
    // Add a keypress listener to the input field to allow adding with the Enter key
    newTodoInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') { // Check if the pressed key was Enter
            addTodo(); // Call addTodo
             event.preventDefault(); // Prevent the default form submission if applicable
        }
    });


    // --- Initial Render ---
    renderTodos(); // Perform an initial render of the todos when the widget is initialized


    // --- Cleanup Function ---
    // Returns a function that will be called by renderer.js when this widget instance is removed.
    // It's crucial to clean up event listeners, intervals, etc., to prevent memory leaks.
    return () => {
        console.log(`To-Do widget cleanup started for ID: ${widgetId}`);
        // Remove event listeners added with addEventListener
        addTodoBtn.removeEventListener('click', addTodo);
        newTodoInput.removeEventListener('keypress', addTodo);

        // Remove event listeners added with .onclick by setting the property to null.
        // We iterate through all current list items' buttons and remove their inline onclick handlers.
        // Note: A more robust approach might store references to these listeners or use event delegation on the UL.
        todoListUl.querySelectorAll('li button').forEach(btn => btn.onclick = null);

        console.log(`To-Do widget cleanup completed for ID: ${widgetId}`);
        // Add any other cleanup needed here later (e.g., clear intervals if any were set)
    };
}