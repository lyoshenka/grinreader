var mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    _ = require('underscore'),
    Q = require('q');

module.exports = function() {
  var deferred = Q.defer(),
      updated = 0;

  Feed.findForList()
  .then(function(feeds) {
    if (!feeds.length) {
      deferred.resolve();
      return;
    }

    _.each(feeds, function(feed) {
      feed.fetchUpdates()
      .then(function() {
        var deferred = Q.defer();
        feed.save(deferred.makeNodeResolver());
        return deferred.promise;
      })
      .then(function() {
        updated += 1;
        if (updated == feeds.length) {
          deferred.resolve(feeds);
        }
      })
      .done();
    });
  });

  return deferred.promise;
};