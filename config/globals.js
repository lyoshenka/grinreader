var mongoose = require('mongoose'),
    Q = require('q');

module.exports = function (req, res, next) {
  // globals

  Q.all([
    mongoose.model('User').findOrCreate(),
    req.flash()
  ])
  .spread(function(user,flashes) {
    req.app.locals.user = user;
    req.app.locals.flashes = flashes;

    if (req.xhr) {
      next();
      return;
    }

    // non-xhr globals
    Q.all([
      mongoose.model('Feed').findForList()
    ])
    .spread(function(feeds) {
      req.app.locals.sidebarFeeds = feeds;
      next();
    })
    .done();
  })
  .fail(function(error) {
    next(error);
  })
  .done();
};