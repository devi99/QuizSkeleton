var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GameSchema = new Schema({
    gameId: {type: Number, required: true},
    gameStatus: {type: String, required: true},
    gameType: {type: String, required: true},
    numberOfPlayers: {type: Number, required: true},
    player: { type: Schema.ObjectId, ref: 'Player' }
});

// Virtual for this question instance URL.
GameSchema
.virtual('url')
.get(function () {
  return '/game/'+this._id;
});

// Export model.
module.exports = mongoose.model('Game', GameSchema);
