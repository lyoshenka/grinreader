var request = require('request'),
    FeedParser = require('feedparser'),
    mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    Q = require('q'),
    _ = require('underscore');

exports.new = function(req, res) {
  Feed.addFeed(req.param('url'))
  .done(function(feed) {
    res.redirect('/feed/' + feed.id);
  }, function(error) {
    res.render('error', {error: error});
  });
};

exports.show = function(req, res) {
  Q.ninvoke(Feed, 'findById', req.params.id)
  .done(function(feed) {
    res.render('feed_show', { feed: feed, xhr: req.xhr });
  }, function(error) {
    res.render('error', {error: error});
  });
};

exports.list = function(req, res) {
  res.render('feed_index');
};

exports.readStatus = function(req, res) {
  Feed.findOneByArticleId(req.params.articleId)
  .done(function(feed) {
    feed.articles.id(req.params.articleId).read = parseInt(req.query.value);
    Q.ninvoke(feed, 'save')
    .then(function() {
      res.json({ success: true });
    });
  }, function(error) {
    res.json({ success: false, error: error });
  });
};

exports.update = function(req, res) {
  Q.ninvoke(Feed, 'findById', req.params.id)
  .done(function(feed) {
    feed.fetchUpdates()
      .done(function() {
        req.flash('success', 'Feed updated.');
        res.redirect('/feed/' + feed.id);
      });
  }, function(error) {
    res.render('error', {error: error});
  });
};


exports.delete = function(req, res) {
  req.flash('error', 'Deleting off right now.');
  res.redirect('/');

  // Q.ninvoke(Feed, 'findById', req.params.id)
  // .done(function(feed) {
  //   Q.ninvoke(feed,'remove')
  //   .done(function() {
  //     req.flash('success', 'Feed deleted.');
  //     res.redirect('/');
  //   })
  // }, function(error) {
  //   res.render('error', {error: error});
  // });
};

exports.deleteAll = function(req, res) {
  req.flash('error', 'Deleting off right now.');
  res.redirect('/');
  // if (req.query.confirm) {
  //   Q.ninvoke(Feed,'remove')
  //   .done(function() {
  //     res.redirect('/');
  //   });
  // }
  // else {
  //   res.render('feed_delete_all');
  // }
};

exports.import = function(req, res) {
  if (req.method == 'POST') {
    var lines = _.compact(req.body.feeds.toString().split(/\r\n|\r|\n/g)),
        count = 0,
        errors = [];

    _.each(lines, function(line) {
      if (line) {
        Feed.addFeed(line)
        .fail(function(error) {
          errors.push(error);
        })
        .fin(function() {
          count = count + 1;
          if (count == lines.length) {
            if (errors.length) {
              res.render('error', {error: errors.join("<br/>")})
              return;
              // req.flash('error', errors.join("<br/>"));
            }
            res.redirect('/');
            return;
          }
        });
      }
    });
  }
  else {
    res.render('feed_import');
  }
};
