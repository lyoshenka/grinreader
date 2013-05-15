var mongoose = require('mongoose'),
    _ = require('underscore');

var articleSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  url: { type: String, default: '' },
  date: { type: Date },
  read: { type: Boolean, default: false }
});

var getArticles = function(articles) {
  return _.sortBy(articles, 'date').reverse();
};

var feedSchema = new mongoose.Schema({
    name: String,
    url: String,
    articles: {type: [articleSchema], get: getArticles }
});

mongoose.model('Feed', feedSchema);