var express = require('express');
var socket = require('socket.io');
var words = require('./words');


// App setup
var app = express();
var server = app.listen(process.env.PORT ||4000, function(){
    console.log('listening for requests');
});

//Socket setup & pass server
var io = socket(server);

var clients = [];
var line_history = [];
var randomWord;

// event-handler for new incoming connections
io.on('connection', function (socket) {
    console.log('made socket connection', socket.id);
    clients.push(socket);
    //If only/first client, allow him to draw and give him a word
    checkUserQuantity();
    // first send the history to the new client
    for (var i in line_history) {
        socket.emit('draw_line', {line: line_history[i]});
    }

    // add handler for message type "draw_line".
    socket.on('draw_line', function (data) {
        //add received line to history
        line_history.push(data.line);
        //send line to all clients
        io.emit('draw_line', {line: data.line});
    });

    socket.on('clear', function (data) {
        //empty line history
        line_history = [];
        //indicate for client browsers to clear their canvas
        io.emit('clear canvas');
    });

    socket.on('disconnect', function () {
        console.log('client %s has disconnected', socket.id);
        var i = clients.indexOf(socket);
        clients.splice(i, 1);
        checkUserQuantity();
    });

    socket.on('submit_guess', function (guess) {
        //Reduce word and user guess to single word lower-case strings
        var original = randomWord.toLowerCase().toString().replace(/\s/g,'');
        var userGuess = guess.toLowerCase().toString().replace(/\s/g,'');
        //Identify if client guessed correct word
        if(original == userGuess){
            socket.emit('correct_guess');
            randomWord = words[Math.floor(Math.random() * words.length)];
            line_history = [];
            io.emit('clear canvas');
            io.emit('drawer', randomWord);
        }
        else{
            socket.emit('incorrect_guess');
        }
    })


    function checkUserQuantity() {
        if(clients.length == 1){
            console.log(clients.length);
            randomWord = words[Math.floor(Math.random() * words.length)];
            var onlyUser = clients[0].id;
            console.log(onlyUser);
            io.to(onlyUser).emit('drawer', randomWord);
        }
        //If not first client, allow him to guess
        else {
            console.log(clients.length);
            socket.emit('guesser');
        }
    }
});