var mongoose = require('mongoose');
var random = require('mongoose-simple-random');

var Schema = mongoose.Schema;

var QuestionSchema = new Schema({
    question: {type: String, required: true},
    correctAnswer: {type: String, required: true},
    fakeAnswer1: {type: String, required: false},
    fakeAnswer2: {type: String, required: false},
    fakeAnswer3: {type: String, required: false},
    fakeAnswer4: {type: String, required: false},
    fakeAnswer5: {type: String, required: false},
    typeMedia: {type: String, required: false},
    urlMedia: {type: String, required: false}
});
QuestionSchema.plugin(random);

// Virtual for this question instance URL.
QuestionSchema
.virtual('url')
.get(function () {
  return '/questions/'+this._id;
});

// Export model.
module.exports = mongoose.model('Question', QuestionSchema);