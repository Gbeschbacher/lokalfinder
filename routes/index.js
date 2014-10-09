var express = require('express');
var shortId = require('shortid');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {
        title: 'Lokalfinder',
        link1: 'Kategorie',
        link2: 'Restaurant'
    });
});

router.get('/category', function (req, res){
    router.uniqueId = shortId.generate();
    res.render('category', {});
});

router.get('/share-categories', function (req, res){
    res.render('category', {});
});


module.exports = router;
