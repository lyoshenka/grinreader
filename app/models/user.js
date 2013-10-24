var mongoose = require('mongoose'),
    _ = require('underscore'),
    Q = require('q')
    ;

var userSchema = new mongoose.Schema({
  unreadOnly: { type: Boolean, default: false }
});

userSchema.virtual('articlesByDate').get(function() {
  return _.sortBy(this.articles, 'date').reverse();
});

userSchema.statics.findOrCreate = function () {
  var self = this,
      deferred = Q.defer();
  this.findOne().exec(function(err, user) {
    if (err) {
      deferred.reject(err);
    }
    else if (!user) {
      self.create({}, function(err, user) {
        if (err) {
          deferred.reject(err);
        }
        deferred.resolve(user);
      });
    }
    else {
      deferred.resolve(user);
    }
  });
  return deferred.promise;
};

mongoose.model('User', userSchema);
