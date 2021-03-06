

var io
var gameSocket
// gamesInSession stores an array of all active socket connections
var gamesInSession = []


const initializeGame = (sio, socket) => {
    
    io = sio 
    gameSocket = socket 

    
    gamesInSession.push(gameSocket)

    
    gameSocket.on("disconnect", onDisconnect)

    
    gameSocket.on("new move", newMove)

    
    gameSocket.on("createNewGame", createNewGame)

    
    gameSocket.on("playerJoinGame", playerJoinsGame)

    gameSocket.on('request username', requestUserName)

    gameSocket.on('recieved userName', recievedUserName)

    
    videoChatBackend()
}


function videoChatBackend() {
    // main function listeners
    gameSocket.on("callUser", (data) => {
        io.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from});
    })

    gameSocket.on("acceptCall", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    })
}   



function playerJoinsGame(idData) {
    /**
     * Joins the given socket to a session with it's gameId
     */

    // A reference to the player's Socket.IO socket object
    var sock = this
    
    // Look up the room ID in the Socket.IO manager object.
    var room = io.sockets.adapter.rooms[idData.gameId]
   // console.log(room)

    // If the room exists...
    if (room === undefined) {
        this.emit('status' , "This game session does not exist." );
        return
    }
    if (room.length < 2) {
        // attach the socket id to the data object.
        idData.mySocketId = sock.id;

        // Join the room
        sock.join(idData.gameId);

        console.log(room.length)

        if (room.length === 2) {
            io.sockets.in(idData.gameId).emit('start game', idData.userName)
        }

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(idData.gameId).emit('playerJoinedRoom', idData);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('status' , "There are already 2 people playing in this room." );
    }
}


function createNewGame(gameId) {
    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('createNewGame', {gameId: gameId, mySocketId: this.id});

    // Join the Room and wait for the other player
    this.join(gameId)
}


function newMove(move) {
    /**
     * First, we need to get the room ID in which to send this message. 
     * Next, we actually send this message to everyone except the sender
     * in this room. 
     */
    
    const gameId = move.gameId 
    
    io.to(gameId).emit('opponent move', move);
}

function onDisconnect() {
    var i = gamesInSession.indexOf(gameSocket);
    gamesInSession.splice(i, 1);
}


function requestUserName(gameId) {
    io.to(gameId).emit('give userName', this.id);
}

function recievedUserName(data) {
    data.socketId = this.id
    io.to(data.gameId).emit('get Opponent UserName', data);
}

exports.initializeGame = initializeGame