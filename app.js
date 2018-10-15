const express = require('express')
const app = express()
const path = require('path');
const index = require('./routes/index');
const questions = require('./routes/questions');
const genres = require('./routes/genres');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', index);
app.use('/questions', questions);
app.use('/genres', genres);

// Error handler
app.use(function(err, req, res, next) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // Render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  module.exports = app;
