
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
    console.log("********************");
    console.log("SERVER INDEX.JS");
    Poll.findById(pollId, '', { lean: true }, function(err, poll) {
        console.log("poll");
        console.log(poll);

        if(poll) {
            var userVoted = false,
            userChoice,
            totalVotes = 0;


            for(c in poll.choices) {
                var choice = poll.choices[c];
                for(v in choice.votes) {
                    var vote = choice.votes[v];
                    console.log("Vote Ip");
                    console.log(vote.ip);
                    console.log("Req.header");
                    console.log(req.header('X-Forwardd-For'));
                    console.log("Req.ip");
                    console.log(req.ip);
                    totalVotes++;
                    if(vote.ip === (req.header('X-Forwardd-For') || req.ip)) {
                        console.log("Vote IP === req.header or req.ip")
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

        console.log("*******************************");
        console.log("SOCKET VOTE");
        console.log("IP");
        console.log(ip)
        console.log("SOCKET HANDSHAKE HEADERS");
        console.log(socket.handshake.headers['x-forwardd-for']);
        console.log("SOCKET HANDSHAKE ADDRESS");
        console.log(socket.handshake.address.address);
        console.log(socket.handshake.address);
        console.log("*******************************");

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
                            console.log("USER VOTED");
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
};
