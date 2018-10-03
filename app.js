const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const index = require('./routes/index');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', index);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

module.exports = app;

//app.listen(port, () => console.log(`Example app listening on port ${port}!`))