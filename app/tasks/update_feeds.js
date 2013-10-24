var mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    _ = require('underscore'),
    Q = require('q');

module.exports = function() {
  var deferred = Q.defer(),
      updated = 0;

  Feed.findAllIds()
  .then(function(feedIds) {
    if (!feedIds.length) {
      deferred.resolve();
      return;
    }

    _.each(feedIds, function(feedId) {
      Q.ninvoke(Feed, 'findById', feedId)
      .done(function(feed) {
        feed.fetchUpdates()
        .then(function() {
          var deferred = Q.defer();
          feed.save(deferred.makeNodeResolver());
          return deferred.promise;
        })
        .done(function() {
          updated += 1;
          if (updated == feedIds.length) {
            deferred.resolve(feedIds);
          }
        });
      });
    });
  });

  return deferred.promise;
};
