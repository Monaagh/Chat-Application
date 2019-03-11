var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var name = [];
var userList = [];
var counter = 0;
var chat_messages = [];

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
}) ;

app.use('/client', express.static('client'));

io.on('connection', function(socket) {

    socket.on('new user', function(cName) {
        var clientID = new Object();
        clientID.name = "User"+counter;
        clientID.socketID = socket.id;
        clientID.color = "black";
        clientID.cookieName = cName;

        userList.push(clientID);
        name.push(clientID.name);
        counter++;
        socket.emit('setCookie', clientID.name);
        io.emit('new user connected', clientID, chat_messages, userList);
    });

    socket.on('old user', function(cName) {
        var nameExist = false;

        for (let i=0; i<userList.length; i++) {
            if (userList[i].name === cName) {
                //userList[i].socketID = socket.id;
                socket.emit('old user connected', userList[i], chat_messages, userList);
                console.log(userList[i].name);
                nameExist = true;
                break;
            }
        }

        if (!nameExist) {
            var clientID = new Object();
            clientID.name = cName;
            clientID.socketID = socket.id;
            clientID.color = "black";

            userList.push(clientID);
            name.push(clientID.name);
            counter++;

            io.emit('old user connected', clientID, chat_messages, userList);
        }
    });

    socket.on('disconnect', function() {

        for (let i=0; i<userList.length; i++) {
            if (userList[i].socketID === socket.id) {
                userList.splice(i, 1);
                break;
            }
        }

        io.emit('userList changed', userList);
    });

    socket.on('change nickname', function(cookieName,msg) {

        var newName = msg.substr(6);
        var success = true;
        for (let i = 0; i < userList.length; i++) {
            if (userList[i].name === newName) {

                var errorMessage = 'This username is not unique. Please choose another name';
                socket.emit('err');
                success = false;
                break;
            }
        }

        if (success) {
            for (let i = 0; i < userList.length; i++) {
                if (userList[i].name === cookieName) {
                    userList[i].name = newName;
                    break;
                }
            }
            socket.emit('userName Changed', newName);
            io.emit('userList changed', userList, newName);
        }
    });

    socket.on('change color', function(cookieName,msg) {

        var newColor = msg.substr(11);
        var success = true;

        for (let i = 0; i < userList.length; i++) {
            if (userList[i].name === cookieName) {
                userList[i].color = newColor;
            }
        }
    });
    socket.on('chat message', function(cookieName,msg){

        for (let i=0; i<userList.length; i++) {
            if (userList[i].name === cookieName) {
                var clientName = userList[i].name;
                var clientNameColor = userList[i].color;
            }
        }


        var timestamp = new Date().getTime();
        var messageInfo = {
            ID: clientName,
          text: msg,
          time: timestamp,
            color: clientNameColor
        };

        chat_messages.push(messageInfo);

        io.emit('chat message', messageInfo);
    })
});

http.listen(8080, function() {
    console.log('listening on *: 8080');
});
