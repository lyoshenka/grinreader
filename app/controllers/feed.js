var request = require('request'),
    FeedParser = require('feedparser'),
    mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    Q = require('q'),
    _ = require('underscore');

function getBaseUrl(url) {
  var baseUrl = null;
  if (url) {
    var match = /((?:https?\:\/\/)?[^\/]+)/.exec(url);
    if (match !== null) {
      baseUrl = match[1];
      if (baseUrl.indexOf('http') !== 0) {
        baseUrl = 'http://' + baseUrl;
      }
      return baseUrl;
    }
  }
  return null;
}

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
  .then(function(feed) {
    var baseUrl = getBaseUrl(feed.link);
    _.each(feed.articles, function(article) {
      if (!baseUrl && article.url) {
        baseUrl = getBaseUrl(article.url);
      }
      if (!baseUrl && article.guid) {
        baseUrl = getBaseUrl(article.guid);
      }
      if (baseUrl) {
        article.body = article.body.replace(/href=("|')?\/([^\/])/gi, 'href=$1'+baseUrl+'/$2');
        article.body = article.body.replace(/src=("|')?\/([^\/])/gi, 'src=$1'+baseUrl+'/$2');
      }
    });
    return feed;
  })
  .done(function(feed) {
    res.render('feed_show', { feed: feed, xhr: req.xhr, maxArticles: 30 });
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
    feed.recalcUnreadCount();
    Q.ninvoke(feed, 'save')
    .done(function() {
      res.json({ success: true });
    });
  }, function(error) {
    res.json({ success: false, error: error });
  });
};

exports.markAllRead = function(req,res) {
  Q.ninvoke(Feed, 'findById', req.params.id)
  .done(function(feed) {
    _.each(feed.articles, function(article) {
      article.read = true;
    });
    feed.unreadCount = 0;
    Q.ninvoke(feed, 'save')
    .done(function() {
      req.flash('success', 'All articles marked as read.');
      res.redirect('/feed/' + feed.id);
    });
  }, function(error) {
    res.render('error', {error: error});
  });
};

exports.update = function(req, res) {
  Q.ninvoke(Feed, 'findById', req.params.id)
  .done(function(feed) {
    feed.fetchUpdates()
      .invoke('save')
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

exports.disable = function(req, res) {
  Q.ninvoke(Feed, 'findById', req.params.id)
  .done(function(feed) {
    feed.disabled = true;
    Q.ninvoke(feed,'save')
    .done(function() {
      req.flash('success', 'Feed updates disabled.');
      res.redirect('/');
    });
  }, function(error) {
    res.render('error', {error: error});
  });
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
              res.render('error', {error: errors.join("<br/>")});
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
