const socket = new WebSocket('ws://localhost:8080');

socket.onerror = function(error) {
    console.error('WebSocket Error:', error);
};

window.socket = socket;