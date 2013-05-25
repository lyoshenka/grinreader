var mongoose = require('mongoose'),
    Q = require('q');

module.exports = function (req, res, next) {
  // globals
  Q.all([
    mongoose.model('User').findOrCreate()
  ])
  .spread(function(user) {
    req.app.locals.user = user;

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