document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send-btn');
    const chatBox = document.getElementById('chat-box');
    const status = document.getElementById('status');

    function appendMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.classList.add(sender);
        messageElement.innerText = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }

    window.sendMessage = function() {
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        appendMessage(messageText, 'user');
        messageInput.value = '';

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: messageText })
        })
        .then(response => {
            // If the response is not successful, parse the error message and throw it
            if (!response.ok) {
                return response.json().then(errorData => {
                    const message = errorData.details ? `${errorData.error} (${errorData.details})` : (errorData.error || 'Unknown server error');
                    throw new Error(message);
                }).catch(() => {
                    // Fallback if the error body isn't valid JSON
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Check if the reply exists and is a string
            if (typeof data.reply === 'string') {
                appendMessage(data.reply, 'bot');
            } else {
                appendMessage('Error: Received an invalid or empty reply from the server.', 'bot');
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            appendMessage(`Error: ${error.message}`, 'bot');
        });
    }

    status.innerText = 'Terminal: Online';
});