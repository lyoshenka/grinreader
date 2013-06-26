var passport = require('passport');

module.exports = function (app) {

  app.get('/login', function(req, res) {
    if (req.user) {
      res.redirect('/');
    }
    res.render('login');
  });

  app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
    })
  );


  app.all('*', function(req, res, next) {
    if (!req.user) {
      res.redirect('/login');
    }
    next();
  });


  var feed = require('../app/controllers/feed');
  app.get('/', feed.list);
  app.post('/feed/new', feed.new);
  app.get('/feed/delete/:id', feed.delete);
  app.get('/feed/delete_all', feed.deleteAll);
  app.all('/feed/import', feed.import);
  app.get('/feed/readStatus/:articleId', feed.readStatus);
  app.get('/feed/:id', feed.show);


  var option = require('../app/controllers/option');
  app.get('/option/unreadOnly', option.unreadOnly);
};