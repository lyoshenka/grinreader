var mongoose = require('mongoose'),
    _ = require('underscore');

var articleSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  url: { type: String, default: '' },
  date: { type: Date },
  read: { type: Boolean, default: false }
});

var feedSchema = new mongoose.Schema({
    name: String,
    url: String,
    link: { type: String, default: '' },
    articles: { type: [articleSchema] }
});

feedSchema.virtual('articlesByDate').get(function() {
  return _.sortBy(this.articles, 'date').reverse();
});

feedSchema.methods.getUnreadCount = function (cb) {
  return _.filter(this.articles, function(article){
    return !article.read;
  }).length;
};

feedSchema.statics.findForList = function (cb) {
  this.find().sort('name').exec(cb);
};

mongoose.model('Feed', feedSchema);