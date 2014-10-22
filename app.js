/**
    Overall requirements
**/

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('lokalfinder');

/**
    Database requirements and connection setup
**/

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/lokalfinder');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {});

/**
    Route import
**/

var routes = require('./routes/index');

var app = express();

/**
    App Configurations
**/

app.enable('trust proxy');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
    req.db = db;
    next();
});

/**
    App Routes
**/

app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
app.get('/polls/:id', routes.listItem);
app.get('/polls', routes.list);
app.post('/polls', routes.create);
app.get('*', routes.index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

/**
    Socket Connection
**/

var io = require('socket.io').listen(app.listen(3000));
io.sockets.on('connection', routes.vote);

module.exports = app;