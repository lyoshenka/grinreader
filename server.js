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
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , MongoStore = require('connect-mongo')(express)
  , raven = require('raven')
  ;

if(process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'Reader' // optional
  });
}

var mongoUrl = process.env.MONGOHQ_URL || 'mongodb://localhost/reader';
mongoose.connect(mongoUrl);

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
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('0a4992489917ba5aadff943b383175bfae107534'));
app.use(express.session({
  store: new MongoStore({
    url: mongoUrl
  }),
  secret: 'irish wristwatch'
}));
app.use(flash());
app.use(require('./config/globals'));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

app.error(raven.middleware.express('https://6beb7ab0a48a4446b128acf98084801e:8b278391ae33444cb2480ad83c26caec@app.getsentry.com/11504'));


// passport
passport.use(new LocalStrategy(
  function(username, password, done) {
    if (username == 'grin' && password == 'grin') {
      return done(null, { username: username });
    }
    return done(null, false);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


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
