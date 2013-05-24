var mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    fs = require('fs'),
    _ = require('underscore'),
    Q = require('q');

module.exports = function(feedFile) {
  var deferred = Q.defer();

  Q.ninvoke(fs, 'readFile', feedFile)
  .done(function(data) {
    var lines = _.compact(data.toString().split("\n")),
        count = 0;

    _.each(lines, function(line) {
      if (line) {
        Feed.addFeed(line)
        .done(function() {
          count = count + 1;
          if (count == lines.length) {
            deferred.resolve();
          }
        }, function(error) {
          deferred.reject(error);
        });
      }
    });
  }, function(error) {
    console.error(error);
    deferred.reject(error);
  });

  return deferred.promise;
};