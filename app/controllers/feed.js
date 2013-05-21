var request = require('request'),
    FeedParser = require('feedparser'),
    mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    Q = require('q');

exports.new = function(req, res) {
  request(req.param('url'))
    .pipe(new FeedParser({}))
    .on('error', function(error) {
      res.render('error', { "error": error });
    })
    .on('complete', function (meta, articles) {

      Feed.findOneByUrl(req.param('url'))
      .done(function(existingFeed) {
        if (existingFeed) {
          throw "Feed exists for this URL.";
        }

        var feed = new Feed({
          name: meta.title,
          url: req.param('url'),
          link: meta.link
        });

        feed.fetchUpdates()
        .then(function() {
          var deferred = Q.defer();
          console.log('saving');
          feed.save(deferred.makeNodeResolver());
          return deferred.promise;
        })
        .done(function() {
          res.redirect('/feed/'+feed.id);
        });
      }, function(error) {
        res.render('error', {error: error});
      });
    });
};

exports.show = function(req, res) {
  Q.ninvoke(Feed, 'findById', req.params.id)
  .done(function(feed) {
    res.render('feed_show', { feed: feed });
  }, function(error) {
    res.render('error', {error: error});
  });
};

exports.list = function(req, res) {
  Feed.findForList()
  .done(function(feeds) {
    res.render('feed_index', {feeds: feeds});
  }, function(error) {
    res.render('error', {error: err});
  });
};

exports.markRead = function(req, res) {
  Feed.findOneByArticleId(req.params.articleId)
  .done(function(feed) {
    feed.articles.id(req.params.articleId).read = 1;
    Q.ninvoke(feed, 'save')
    .then(function() {
      res.json({ success: true });
    });
  }, function(error) {
    res.json({ success: false, error: error });
  });
};