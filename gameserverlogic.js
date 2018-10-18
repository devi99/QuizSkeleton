var io;
var gameSocket;
var db;
var Question = require('./models/question');
var Genre = require('./models/genre');
var Game = require('./models/game');
var async = require('async');
var random = require('mongoose-simple-random');

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
    gameSocket.on('hostNextRound', hostNextRound);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerRestart', playerRestart);
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
function hostPrepareGame(hostData) {
    console.log("hostPrepareGame...");

    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : hostData.gameId,
    };
    //console.log(hostData.selectedGenres);
    //var selGenres = ["Kids", "History"];
    //console.log(selGenres);

    var genres = Genre.find({name: {$in: hostData.selectedGenres}});
    genres.select('_id');
    genres.exec(function (err, results) {
        if (err) return console.log(err);
        console.log(results);
        var filter = { genre: { $in: results } };
        Question.findRandom(filter, {}, {limit: hostData.numQuestions}, function(err, results) {
            if (!err) {
                console.log(" results findRandom");
                console.log(results);
            // Create a Game object
                var game = new Game(
                    { gameId: hostData.gameId,
                        gameStatus: 0,
                        gameType:hostData.gameType,
                        numberOfPlayers:hostData.numberOfPlayers,
                        questions: results
                    });
                game.save(function (err) {
                    if (err) {
                         console.log("game save error#" + err);
                        return err; 
                    }
                    console.log("Game saved...");
                });
            }
          });        
      });

     console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
};

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(0,gameId);
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
function hostNextRound(data) {
    console.log('round' + data.round);
    if(!data.gameOver ){
        // Send a new set of words back to the host and players.
        sendWord(data.round, data.gameId);
    } else {

      if(!data.done)
      {
/*         //updating players win count
        db.all("SELECT * FROM player WHERE player_name=?",data.winner, function(err, rows) {
        rows.forEach(function (row) {
            win=row.player_win;
            win++;
            console.log(win);
            db.run("UPDATE player SET player_win = ? WHERE player_name = ?", win, data.winner);
            console.log(row.player_name, row.player_win);
        })
        }); */
        data.done++;
      }
        // If the current round exceeds the number of words, send the 'gameOver' event.
      io.sockets.in(data.gameId).emit('gameOver',data);
    }
};

// function for finding leader
function findLeader()
{
  console.log("finding leader");
    var sock=this;
    var i=0;
    leader={};
    db.all("SELECT * FROM player ORDER BY player_win DESC LIMIT 10",function(err,rows)
    {
      if(rows!=undefined)
      {
        rows.forEach(function (row)
        {
          leader[i]={};
          leader[i]['name']=row.player_name;
          leader[i]['win']=row.player_win;
          console.log(row.player_name);
          console.log(row.player_win);
          i++;
        })
      }
      console.log("found leader");
      sock.emit('showLeader',leader);
    });

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
};

/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
    console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
};

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    console.log('Player: ' + data.playerName + ' ready for new game.');
    console.log('playerId: ' + this.id );

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
};

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
    const game = await Game.findOne({'gameId' :id})
    .populate('questions').exec();
    
    var answerList = [
        game.questions[i].fakeAnswer1, 
        game.questions[i].fakeAnswer2, 
        game.questions[i].fakeAnswer3,
        game.questions[i].fakeAnswer4,
        game.questions[i].fakeAnswer5];

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

