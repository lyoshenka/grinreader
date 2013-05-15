
/*
 * GET home page.
 */

var request = require('request'),
    FeedParser = require('feedparser');


exports.index = function(req, res){
  res.render('index', { "feeds": [
    'http://thefeature.net/rss/links',
    'http://onethingwell.org/rss'
  ] });
};

exports.feed = function(req, res) {
  request(req.params.url)
    .pipe(new FeedParser({}))
    .on('error', function(error) {
      res.render('error', { "error": error });
    })
    .on('complete', function (meta, articles) {
      res.render('feed', { "meta": meta, "articles": articles });
    });
};