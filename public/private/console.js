function toggleConsole() {
    const consoleElement = document.getElementById('console');
    const toggleButton = document.getElementById('toggleConsoleButton');
    if (consoleElement.style.display === 'none' || consoleElement.style.display === '') {
        consoleElement.style.display = 'block';
        toggleButton.textContent = 'Hide Console';
    } else {
        consoleElement.style.display = 'none';
        toggleButton.textContent = 'Show Console';
    }
}

// Add event listener to toggle the console on button click
document.getElementById('toggleConsoleButton').addEventListener('click', toggleConsole);



// Function to add a message to the console
function addConsoleMessage(message) {
    const consoleBody = document.getElementById('console-body');
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    consoleBody.appendChild(messageElement);
    // Scroll to the bottom of the console
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

// Function to clear the console
function clearConsole() {
    const consoleBody = document.getElementById('console-body');
    consoleBody.innerHTML = '';
}

// Example usage
document.addEventListener('DOMContentLoaded', (event) => {
    addConsoleMessage('Console initialized.');
    //addConsoleMessage('This is a sample message.');
});
