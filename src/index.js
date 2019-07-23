const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicFolderPath = path.join(__dirname, '../public');


// Setup static directory to serve
app.use(express.static(publicFolderPath));

io.on('connection', (socket) => {
  console.log('New websocket connection');

  socket.on('join', ({username, room}, callback) => {
    const {error, user} = addUser({
      id: socket.id,
      username,
      room
    });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', generateMessage('Welcome'));
    socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if(!user) return callback('Something went wrong, please reconnect');

    if(filter.isProfane(message)) return callback('No bad words!');

    io.to(user.room).emit('message', generateMessage(message, user.username));
    callback();
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);

    if(!user) return callback('Something went wrong, please reconnect');

    io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${location.latitude},${location.longitude}`, user.username));
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', generateMessage(`${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
});

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
