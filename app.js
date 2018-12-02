// Loading libs
var http = require('http');
var fs = require('fs');
var ent = require('ent'); // To escape html scripting
var express = require('express');
var path = require('path');
var app = express();

// Variables
const port = 8080;
const secret = '!_seCr3t_ch4T';
const namespace = '/chat';

// Loading of the file index.html displayed to the client
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// 404 - Not found
app.use(function(req, res, next){
  res.setHeader('Content-Type', 'text/plain');
  res.status(404).send("This page doesn''t exist !");
});

// Starts the server
var server = app.listen(port, () => console.log(`Server started on port ${port}`));

// Loading socket.io
var io = require('socket.io').listen(server);

// Loading sessions
var session = require('express-session')({
    secret: secret,
    resave: true,
    saveUninitialized: true
});

// Loadings sessions in socket.io
var sharedsession = require("express-socket.io-session");

// Attachs session
app.use(session);
 
// Shares session with io sockets
io.of(namespace).use(sharedsession(session, { autoSave:true }));

io.of(namespace).on('connection', function (socket) {
	// socket.handshake.session allows to access session's variables

    socket.on('new_arrival', function(username) {
    	// Saving the username
        socket.handshake.session.username = ent.encode(username);

	    // Sends a confirmation message
	    socket.emit('confirm_connection', `Welcolme ${socket.handshake.session.username} ! You're online !`);

	    // Indicates the arrival of the new client to others
	    socket.emit('client_arrival', `Welcolme ${socket.handshake.session.username} !`);
	    socket.broadcast.emit('client_arrival', `${socket.handshake.session.username} joined the chat !`);
    });
    
    // As soon as we receive an "update_todolist" from a client, we process the information
    socket.on('message', function (message) {
    	message = ent.encode(message);
    	console.log(`Reception of "${message}" from ${socket.handshake.session.username}`);

		// Sends the message to everybody
		io.of(namespace).emit('message', {username : socket.handshake.session.username, content : message});
    }); 
});
