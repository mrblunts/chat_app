const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');

const port = 5001;
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// Initialize Socket.IO
const io = socketIo(server);

let users = [];  // Store online users

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('send name', (username) => {
        // Add user to online users list
        users.push({ name: username, status: 'online', socketId: socket.id });
        io.emit('update users', users);  // Update the user list for all clients
    });

    socket.on('send message', (chat) => {
        // Get current timestamp
        const timestamp = new Date().toLocaleString();

        // Broadcast the message along with the timestamp and sender's name
        io.emit('send message', {
            chat,
            timestamp,
            username: users.find(user => user.socketId === socket.id).name
        });
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);  // Notify all users except the sender
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');  // Hide typing indicator for everyone
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Remove user from online users list
        users = users.filter(user => user.socketId !== socket.id);
        io.emit('update users', users);  // Update the user list for all clients
    });
});

server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
