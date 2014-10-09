var express = require('express');
var router = express.Router();

router.get('/list', function (req, res) {
  var db = req.db;

  db.collection('Questions').find().toArray(function (err, items) {
    res.json(items);
  });

});

router.get('/create', function (req, res){
    res.render('create', {title: 'Add new question'});
});

router.post('/create', function (req, res){
    var db = req.db;

    //GET ALL VALUES WE WANT TO ADD TO THE QUESTION
    //req.body.answer1
    //req.body.answer2

    db.collection('Questions').insert({
        "url": "GENERATE UNIQUE URL AND PUT IT IN HERE",
        "question": "REPLACE WITH CORRECT VALUES",
        "answer1": "ANSWER 1",
        "answerCount1": 10,
        "answer2": "ANSWER 2",
        "answerCount2": 5,
    }, function(err, result) {
        if (err) throw err;
        if (result) {
            res.location("/");
            res.redirect("/");
        };
    });

})

module.exports = router;
