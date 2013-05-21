
module.exports = function (app) {

  var feed = require('../app/controllers/feed');
  app.get('/', feed.list);
  app.post('/feed/new', feed.new);
  app.get('/feed/:id', feed.show);
  app.post('/markRead/:articleId', feed.markRead);
};