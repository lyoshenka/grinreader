var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , twig = require('twig')
  , mongoose = require('mongoose')
  , flash = require('connect-flash')
  , argv = require('optimist').argv
  , Q = require('q')
  , fancyTimestamp = require('fancy-timestamp')
  ;

if(process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'Reader' // optional
  });
}

mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost/reader');

// load models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
  require(models_path+'/'+file);
});


if (argv.u) {
  // update feeds
  require('./app/tasks/update_feeds')().fin(function() { process.exit(); });
  return;
}

if (argv.i) {
  // import feeds
  require('./app/tasks/import_feeds')(argv.i).fin(function() { process.exit(); });
  return;
}

// twig extension
twig.extendFilter("fancyTimestamp", function(timestamp) {
    return fancyTimestamp(timestamp, true);
});


var app = express();

// all environments
app.set('port', process.env.PORT || 8000);
app.set('views', __dirname + '/app/views');
app.set('view engine', 'twig');
app.set("twig options", { strict_variables: false });
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('0a4992489917ba5aadff943b383175bfae107534'));
app.use(express.session());
app.use(flash());
app.use(function (req, res, next) {
  mongoose.model('Feed').findForList()
  .done(function(feeds){
    res.locals({
      sidebarFeeds: feeds
    });
    next();
  });
});
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// load routes
require('./config/routing')(app);

// servertime!
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});