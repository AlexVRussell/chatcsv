const messagesDiv = document.getElementById('messages');
const inputField = document.getElementById('input');
const sendButton = document.getElementById('send');
const userNameField = document.getElementById('userName');
const themeSelect = document.getElementById('theme');
const saveSettingsButton = document.getElementById('saveSettings');
const clearHistoryButton = document.getElementById('clearHistory');

function loadSettings() {
    const settings = localStorage.getItem('chatSettings');
    if (settings) {
        return JSON.parse(settings);
    }
    return {
        userName: '',
        theme: 'light',
        chatHistory: [],
        interests: []
    };
}

function saveSettings(settings) {
    localStorage.setItem('chatSettings', JSON.stringify(settings));
}

let settings = loadSettings();

function applyTheme() {
    const inputs = document.querySelectorAll('input, select, .card, .card-body');
    
    if (settings.theme === 'dark') {
        document.body.style.backgroundColor = '#222';
        document.body.style.color = '#fff';
        
        // For loop cuz it would be WAYYY more code to write just to change each style
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].style.backgroundColor = '#333';
            inputs[i].style.color = '#fff';
            inputs[i].style.borderColor = '#555';
        }
    } else {
        document.body.style.backgroundColor = '#fff';
        document.body.style.color = '#000';
        
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].style.backgroundColor = '#fff';
            inputs[i].style.color = '#000';
            inputs[i].style.borderColor = '#ddd';
        }
    }
}

userNameField.value = settings.userName;
themeSelect.value = settings.theme;
applyTheme();

function displayMessage(text, sender, redirectPage) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;

    messagesDiv.appendChild(msgDiv);

    if (redirectPage) {
        const link = document.createElement('a');
        link.href = redirectPage;
        link.textContent = 'Open page';
        link.className = 'redirect-link';
        link.target = '_blank';
        messagesDiv.appendChild(link);
    }
}

function restoreChatHistory() {
    for (let i = 0; i < settings.chatHistory.length; i++) {
        const msg = settings.chatHistory[i];
        displayMessage(msg.text, msg.sender, msg.redirect);
    }
}

function trackInterests(message) {
    const keywords = ['help', 'about', 'joke'];
    for (let i = 0; i < keywords.length; i++) {
        if (message.toLowerCase().includes(keywords[i])) {
            if (!settings.interests.includes(keywords[i])) {
                settings.interests.push(keywords[i]);
            }
        }
    }
}

function getPersonalizedSuggestion() {
    if (settings.interests.length === 0) {
        return '';
    }
    
    const suggestions = {
        'help': 'Need more help? Try typing "about" to learn more about me!',
        'about': 'Want to lighten the mood? Try asking for a "joke"!',
        'joke': 'Check out the "help" page for more features!'
    };
    
    const lastInterest = settings.interests[settings.interests.length - 1];
    return suggestions[lastInterest] || '';
}

async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;

    displayMessage(message, 'user');
    inputField.value = '';
    
    trackInterests(message);
    
    settings.chatHistory.push({
        text: message,
        sender: 'user',
        redirect: ''
    });

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        displayMessage(data.message, 'bot', data.redirect);
        
        const suggestion = getPersonalizedSuggestion();
        if (suggestion) {
            displayMessage(suggestion, 'bot');
        }
        
        settings.chatHistory.push({
            text: data.message,
            sender: 'bot',
            redirect: data.redirect || ''
        });
        
        saveSettings(settings);

    } catch (error) {
        displayMessage('Error: Could not reach server', 'bot');
    }
}

// Save user settings and preferences
saveSettingsButton.addEventListener('click', function() {
    settings.userName = userNameField.value.trim();
    settings.theme = themeSelect.value;
    saveSettings(settings);
    applyTheme();
    alert('Settings saved!');
});

clearHistoryButton.addEventListener('click', function() {
    settings.chatHistory = [];
    settings.interests = [];
    saveSettings(settings);
    messagesDiv.innerHTML = '';
    displayMessage('Chat history cleared!', 'bot');
});

sendButton.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

restoreChatHistory();

if (settings.userName) {
    displayMessage('Welcome back, ' + settings.userName + '!', 'bot');
} else {
    displayMessage('Hello! Try typing: help, about, or joke', 'bot');
}