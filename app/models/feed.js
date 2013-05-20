var mongoose = require('mongoose'),
    _ = require('underscore'),
    request = require('request'),
    FeedParser = require('feedparser'),
    Q = require('q')
    ;

var articleSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  url: { type: String, default: '' },
  guid: { type: String, default: '' },
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

feedSchema.methods.getIds = function() {
  return _.pluck(this.articles, 'guid');
};

feedSchema.methods.getArticleByGuid = function(guid) {
  return _.find(this.articles, function(article) {
    return article.guid == guid;
  });
};

feedSchema.methods.fetchUpdates = function() {
  var self = this,
      deferred = Q.defer();

  request(self.url)
    .pipe(new FeedParser({}))
    .on('error', function(error) {
      Q.reject(error);
    })
    .on('complete', function (meta, articles) {
      var existingIds = self.getIds();

      _.each(articles, function(article) {

        var a = _.contains(existingIds, article.guid) ?
                self.articles[self.articles.indexOf(self.getArticleByGuid(article.guid))] :
                self.articles.create({ guid: article.guid });

        // console.log(article.title);
        // console.log(_.contains(existingIds, article.guid));

        a.set({
          title: article.title,
          body: article.description,
          url: article.link,
          date: article.pubdate
        });

        if (a.isNew) {
          console.log('added ' + a.title);
          self.articles.push(a);
        }
      });

      deferred.resolve(self);
    });

  return deferred.promise;
}

feedSchema.methods.getUnreadCount = function () {
  return _.filter(this.articles, function(article){
    return !article.read;
  }).length;
};

feedSchema.statics.findForList = function () {
  var deferred = Q.defer();
  this.find().sort('name').exec(deferred.makeNodeResolver());
  return deferred.promise;
};

feedSchema.statics.findOneByUrl = function (url) {
  var deferred = Q.defer();
  this.findOne({ url: url }).exec(deferred.makeNodeResolver());
  return deferred.promise;
};


mongoose.model('Feed', feedSchema);