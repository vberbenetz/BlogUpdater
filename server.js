//server.js

// Initialization =====================================================================================================/
var config = require('./config.js');

var express = require('express');
var app = express();
var morgan = require('morgan');         //Express js logger
var bodyParser = require('body-parser');

// Configuration ======================================================================================================/

// setup express
app.use(morgan({ format : 'dev' }));
app.use(bodyParser());

app.set('view engine', 'ejs');

// Routes =============================================================================================================/
require('./app/routes.js')(app);

// Launch =============================================================================================================/
app.listen(config.serverPort);
console.log('Listening on port ' + config.serverPort);