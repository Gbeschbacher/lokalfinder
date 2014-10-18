var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'lokalfinder');
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);


exports.index = function(req, res){
    res.render('index', {
        title: 'Polls'
    });
};

exports.partials = function(req, res){
    res.render('partials/' + req.params.name + '.html');
};

exports.list = function(req, res){
    Poll.find({}, 'question', function(error, polls){
        res.json(polls);
    });
};

exports.listItem = function(req, res){
    Poll.findById(req.params.id, function(error, poll){
        res.send(poll);
    });
};

exports.poll = function(req, res){
    var pollId = req.params.id;
    Poll.findById(pollId, '', { lean: true }, function(err, poll) {
        if(poll) {
            var userVoted = false,
            userChoice,
            totalVotes = 0;

            for(c in poll.choices) {
                var choice = poll.choices[c];
                for(v in choice.votes) {
                    var vote = choice.votes[v];
                    totalVotes++;
                    if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
                        userVoted = true;
                        userChoice = { _id: choice._id, text: choice.text };
                    }
                }
            }

            poll.userVoted = userVoted;
            poll.userChoice = userChoice;
            poll.totalVotes = totalVotes;
            res.json(poll);
        } else {
            res.json({error:true});
        }
    });
};

exports.create = function(req, res) {
    var reqBody = req.body,
    choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
    pollObj = {question: reqBody.question, choices: choices};
    var poll = new Poll(pollObj);
    poll.save(function(err, doc) {
        if(err || !doc) {
            throw 'Error';
        } else {
            res.json(doc);
        }
    });
};