var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Q = require('q'),
    _ = require('underscore');

exports.unreadOnly = function(req, res) {
  User.findOrCreate()
  .done(function(user) {
    console.log(req.query);
    user.unreadOnly = parseInt(req.query.value);
    Q.ninvoke(user, 'save')
    .then(function() {
      res.json({ success: true });
    });
  }, function(error) {
    res.json({ success: false, error: error });
  });
};