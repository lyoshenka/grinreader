
/*
 * GET home page.
 */

var request = require('request'),
    FeedParser = require('feedparser');


exports.index = function(req, res){
  request('http://thefeature.net/rss/links')
    .pipe(new FeedParser({}))
    .on('error', function(error) {
      // always handle errors
    })
    .on('meta', function (meta) {
      // do something
    })
    .on('article', function (article) {
      // do something else
    })
    .on('complete', function (meta, articles) {
      res.render('index', { "meta": meta, "articles": articles });
    })
    .on('end', function () {
      // next
    });
};