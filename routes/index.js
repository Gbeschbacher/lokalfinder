
var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'lokalfinder');
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);


exports.index = function(req, res){
    res.render('index', {
        title: 'Lokalfinder'
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
                    if(vote.ip === (req.header('X-Forwardd-For') || req.ip)) {
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
    var reqBody = req.body;
    var choices = reqBody.choices;

    pollObj = {category: reqBody.category, choices: choices};

    var poll = new Poll(pollObj);
    poll.save(function(err, doc) {
        if(err || !doc) {
            throw 'Error';
        } else {
            res.json(doc);
        }
    });
};

exports.vote = function(socket) {

    socket.on('send:vote', function(data) {

        var ip = socket.handshake.headers['x-forwardd-for'] || socket.handshake.address.address || socket.handshake.address;

        Poll.findById(data.poll_id, function(err, poll) {

            var choice = poll.choices.id(data.choice);
            choice.votes.push({ ip: ip });

            poll.save(function(err, doc) {

                var theDoc = {
                     _id: doc._id,
                    question: doc.question,
                    choices: doc.choices,
                    userVoted: false,
                    totalVotes: 0
                };

                for(var i = 0, ln = doc.choices.length; i < ln; i++) {
                    var choice = doc.choices[i];

                    for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
                        var vote = choice.votes[j];
                        theDoc.totalVotes++;
                        theDoc.ip = ip;

                        if(vote.ip === ip) {
                            theDoc.userVoted = true;
                            theDoc.userChoice = { _id: choice._id, text: choice.text };
                        }
                  }
                }

                socket.emit('myvote', theDoc);
                socket.broadcast.emit('vote', theDoc);
            });
        });
    });


    socket.on('send:display', function (data){
        Poll.findById(data.poll_id, function(err, poll){

            var obj = {
                _id: poll._id,
                choices: poll.choices,
                userChoice: data.choice,
                totalVotes: 0,
                userVoted: true
            };

            for(var i=0, ln = obj.choices.length; i<ln; i++){
                for(var j=0, jLn = obj.choices[i].votes.length; j < jLn; j++){
                    obj.totalVotes++;
                }
            }

            socket.emit('updateView', obj);

        });
    });

};
