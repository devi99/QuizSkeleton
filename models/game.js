var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GameSchema = new Schema({
    gameId: {type: Number, required: true},
    gameStatus: {type: Number, required: true},
    gameType: {type: Number, required: true},
    numberOfPlayers: {type: Number, required: true},
    questions: [{ type: Schema.ObjectId, ref: 'Question' }]
});

// Virtual for this question instance URL.
GameSchema
.virtual('url')
.get(function () {
  return '/game/'+this._id;
});

// Export model.
module.exports = mongoose.model('Game', GameSchema);
