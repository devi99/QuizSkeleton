var io;
var gameSocket;
var db;
var Question = require('./models/question');
var Game = require('./models/game');
var async = require('async');
//var random = require('mongoose-simple-random');

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket,sdb){
    io = sio;
    gameSocket = socket;
    db=sdb;
    gameSocket.emit('connected', { message: "You are connected!" });

    //common event
    //gameSocket.on('findLeader',findLeader);

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    //gameSocket.on('hostNextRound', hostNextRound);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    //gameSocket.on('playerAnswer', playerAnswer);
    //gameSocket.on('playerRestart', playerRestart);
}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */
/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
    console.log("hostCreateNewGame...");
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join the Room and wait for the players
    this.join(thisGameId.toString());
};

/*
 * All players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId) {
    console.log("hostPrepareGame...");
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : gameId
    };

    Question.findRandom({}, {}, {limit: 5}, function(err, results) {
        if (!err) {
        // Create a Game object
            var game = new Game(
                { gameId: gameId,
                    gameStatus: 'Not started',
                    gameType:'0',
                    numberOfPlayers:2,
                    questions: results
                });
            game.save(function (err) {
                if (err) { return next(err); }
                console.log("Game saved...");
            });
          //console.log(results); 
        }
      });

     console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(0,gameId);
};

/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    //var room = gameSocket.manager.rooms["/" + data.gameId];
    var room = gameSocket.adapter.rooms[data.gameId]; 

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */

/**
 * Get a word for the host, and a list of words for the player.
 *
 * @param wordPoolIndex
 * @param gameId The room identifier
 */
async function sendWord(wordPoolIndex, gameId) {
    console.log("sendWord#" + wordPoolIndex + "#" + gameId )
    var data = await getWordData(wordPoolIndex, gameId);
    console.log(data);
    io.sockets.in(gameId).emit('newWordData', data);
}
/**
 * This function does all the work of getting a new words from the pile
 * and organizing the data to be sent back to the clients.
 *
 * @param i The index of the wordPool.
 * @returns {{round: *, word: *, answer: *, list: Array}}
 */
async function getWordData(i, id){
    console.log("getwordData");
    var wordData;
    //const count = await Question.count().exec();
    //var rnd = Math.floor(Math.random() * count);
    //const question_list = await Question.findOne().skip(rnd).exec();
    //const question_list = await Game.findOne({'_id' :id},'question').exec();
    //console.log(question_list);
    const game = await Game.findOne({'gameId' :id})
    .populate('questions').exec();
/*     await Game.findOne({'gameId' :id})
        .populate('questions')
        .exec(function (err, game) {
        if (err) { console.log(err); }
        // Successful, so render.
        //console.log(game.questions[i].title);
    }); */
    
    var answerList = [game.questions[i].fakeAnswer1, 
    game.questions[i].fakeAnswer2, 
    game.questions[i].fakeAnswer3,
    game.questions[i].fakeAnswer4,
    game.questions[i].fakeAnswer5];

    //console.log(answerList);
    rnd = Math.floor(Math.random() * 5);
    answerList.splice(rnd, 0, game.questions[i].correctAnswer); 
        // Package the words into a single object.
    wordData = {
        round: i,
        word : game.questions[i].title,   // Displayed Word
        answer : game.questions[i].correctAnswer, //question_list[i].correctAnswer, Correct Answer
        typeMedia : game.questions[i].typeMedia,
        urlMedia : game.questions[i].urlMedia,
        list : answerList      // Word list for player (decoys and answer)
    };     
    //console.log("inside await");   

      //  console.log(wordData);
    return wordData;

}
 
/*
 * Javascript implementation of Fisher-Yates shuffle algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
 */
function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

