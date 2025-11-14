const messagesDiv = document.getElementById('messages');
const inputField = document.getElementById('input');
const sendButton = document.getElementById('send');

// Display a message in the chat
function displayMessage(text, sender, redirectPage) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;

    messagesDiv.appendChild(msgDiv);

    // Add redirect link if provided
    if (redirectPage) {
        const link = document.createElement('a');
        link.href = redirectPage;
        link.textContent = 'Open page';
        link.className = 'redirect-link';
        link.target = '_blank';
        messagesDiv.appendChild(link);
    }

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message to server
async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;
    
    // Display user message
    displayMessage(message, 'user');
    inputField.value = '';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        displayMessage(data.message, 'bot', data.redirect);

    } catch (error) {
        displayMessage('Error: Could not reach server', 'bot');
    }
}

sendButton.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
displayMessage('Hello! Try typing: help, about, or joke', 'bot');