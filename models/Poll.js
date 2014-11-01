var mongoose = require('mongoose');

var voteSchema = new mongoose.Schema({ ip: 'String' });

var choiceSchema = new mongoose.Schema({
    text: String,
    votes: [voteSchema]
});

exports.PollSchema = new mongoose.Schema({
    category: { type: Boolean, required: true },
    choices: [choiceSchema],
    dataAsync: [mongoose.Schema.Types.Mixed]
});