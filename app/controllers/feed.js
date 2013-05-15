var request = require('request'),
    FeedParser = require('feedparser'),
    mongoose = require('mongoose'),
    Feed = mongoose.model('Feed');

exports.new = function(req, res) {
  request(req.param('url'))
    .pipe(new FeedParser({}))
    .on('error', function(error) {
      res.render('error', { "error": error });
    })
    .on('complete', function (meta, articles) {

      var feed = new Feed({
        name: meta.title,
        url: meta.link
      });

      for (var i = articles.length - 1; i >= 0; i--) {
        feed.articles.push({
          title: articles[i].title,
          body: articles[i].description,
          url: articles[i].link,
          date: articles[i].pubdate
        });
      };

      feed.save(function (err) {
        if (err) {
          res.render('error', {error: err});
        }
        res.redirect('/feed/'+feed.id);
      });
    });
};

exports.show = function(req, res) {
  Feed.findById(req.params.id, function (err, feed) {
    if (err) {
      res.render('error', {error: err});
    }
    res.render('feed_show', { feed: feed });
  })
};

exports.list = function(req, res) {
  res.render('index', {feeds: []});
};