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
      .then(function(existingFeed) {
        if (existingFeed) {
          throw "Feed exists for this URL."
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
        .then(function(){
          res.redirect('/feed/'+feed.id);
        })
        .done();
      })
      .fail(function(error) {
        res.render('error', {error: error});
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
  Feed.findForList()
  .then(function(feeds) {
    res.render('feed_index', {feeds: feeds});
  })
  .fail(function(error) {
    res.render('error', {error: err});
  })
  .done();
};