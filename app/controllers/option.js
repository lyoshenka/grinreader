var Q = require('q');

exports.unreadOnly = function(req, res) {
  var user = req.app.locals.user;
  user.unreadOnly = parseInt(req.query.value);
  Q.ninvoke(user, 'save')
  .done(function() {
    res.json({ success: true });
  }, function(error) {
    res.json({ success: false, error: error });
  });
};