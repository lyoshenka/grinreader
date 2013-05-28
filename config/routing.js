module.exports = function (app) {

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