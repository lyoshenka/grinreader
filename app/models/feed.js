var mongoose = require('mongoose'),
    _ = require('underscore'),
    request = require('request'),
    FeedParser = require('feedparser'),
    Q = require('q')
    ;

var articleSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  summary: { type: String, default: '' },
  url: { type: String, default: '' },
  original_link: { type: String, default: '' }, // when FeedBurner or Pheedo puts a special tracking url in the link property, this contains the original link
  date: { type: Date }, // most recent update
  pubdate: { type: Date }, // original published date
  author: { type: String, default: '' },
  guid: { type: String, default: '' },
  image: {
    url: { type: String, default: '' },
    title: { type: String, default: '' }
  },
  source: {
    url: { type: String, default: '' },
    title: { type: String, default: '' }
  },
  categories: [String],
  enclosures: [{
    url: String,
    type: { type: String, default: '' },
    length: { type: String, default: '' }
  }],
  read: { type: Boolean, default: false }
});

var feedSchema = new mongoose.Schema({
  title: String,
  description: { type: String, default: '' },
  link: { type: String, default: '' }, // url of the website the feed is for
  url: String, // url of the feed
  date: { type: Date }, // date of most recent update
  pubdate: { type: Date }, // original published date
  author: { type: String, default: '' },
  lastError: { type: String, default: '' },
  unreadCount: { type: Number, default: 0, min: 0 },
  language: { type: String, default: '' },
  image: {
    url: { type: String, default: '' },
    title: { type: String, default: '' }
  },
  copyright: { type: String, default: '' },
  generator: { type: String, default: '' },
  categories: [String],
  articles: { type: [articleSchema] }
});

feedSchema.virtual('articlesByDate').get(function() {
  return _.sortBy(this.articles, 'date').reverse();
});

feedSchema.methods.getArticleIds = function() {
  return _.pluck(this.articles, 'guid');
};

feedSchema.methods.getArticleByGuid = function(guid) {
  return _.find(this.articles, function(article) {
    return article.guid == guid;
  });
};

feedSchema.methods.recalcUnreadCount = function() {
  this.unreadCount = _.filter(this.articles, function(article) {
    return !article.read;
  }).length;
};

feedSchema.statics.findAllIds = function() {
  var deferred = Q.defer();
  this.find({}, {_id: 1}).exec(function(err, feeds) {
    if (err != null) {
      deferred.reject(err);
    }
    else {
      deferred.resolve(_.pluck(feeds, '_id'));
    }
  });
  return deferred.promise;
};

feedSchema.statics.findForSidebar = function () {
  var deferred = Q.defer();
  this.find({}, {title: 1, url: 1, unreadCount: 1}).sort({title: 1}).exec(deferred.makeNodeResolver());
  return deferred.promise;
};

feedSchema.statics.findOneByUrl = function (url) {
  var deferred = Q.defer();
  this.findOne({ url: url }).exec(deferred.makeNodeResolver());
  return deferred.promise;
};

feedSchema.statics.findOneByArticleId = function (articleId) {
  var deferred = Q.defer();
  this.findOne({ articles: { $elemMatch: { _id: articleId } }}).exec(deferred.makeNodeResolver());
  return deferred.promise;
};

feedSchema.methods.fetchUpdates = function(articles) {
  var self = this,
      onComplete = function(articles) {
        var existingIds = self.getArticleIds();

        _.each(articles, function(article) {
          var a = _.contains(existingIds, article.guid) ?
                  self.articles[self.articles.indexOf(self.getArticleByGuid(article.guid))] :
                  self.articles.create({ guid: article.guid });

          a.set({
            title: article.title,
            summary: article.summary || '',
            body: article.description,
            url: article.link,
            original_link: article.origlink || '',
            date: article.date,
            pubdate: article.pubdate,
            author: article.author || '',
            image: { url: article.image.url || '', title: article.image.title || '' },
            categories: article.categories || [],
            source: { url: article.source.url || '', title: article.source.title || '' }
          });

          if (a.isNew) {
            _.each(article.enclosures, function(enclosure) {
              a.enclosures.push({
                url: enclosure.url,
                type: enclosure.type || '',
                length: enclosure.length || ''
              });
            });

            self.articles.push(a);
          }
        });

        self.recalcUnreadCount();
      };

  if (articles)
  {
    onComplete(articles);
    return Q(self);
  }
  else
  {
    var deferred = Q.defer();

    request(self.url)
      .pipe(new FeedParser({}))
      .on('error', function(error) {
        self.lastError = error;
        deferred.resolve(self);
      })
      .on('complete', function (meta, articles) {
        onComplete(articles);
        deferred.resolve(self);
      });

    return deferred.promise;
  }
};

feedSchema.statics.addFeed = function (url) {
  var deferred = Q.defer(),
      self = this;

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      request(url)
      .pipe(new FeedParser({}))
      .on('error', function(error) {
        console.log('FAIL: ' + url);
        if (error == 'Error: Not a feed') {
          deferred.reject('Not a feed: ' + url);
        }
        else {
          deferred.reject(error);
        }
      })
      .on('complete', function (meta, articles) {
        self.findOneByUrl(url)
        .done(function(existingFeed) {
          if (existingFeed) {
            deferred.resolve(existingFeed);
            return;
          }

          Q.ninvoke(self, 'create', {
            title: meta.title || 'No Title',
            description: meta.description || '',
            link: meta.link,
            url: url,
            date: meta.date,
            pubdate: meta.pubdate,
            author: meta.author || '',
            language: meta.language || '',
            image: { url: meta.image.url || '', title: meta.image.title || '' },
            copyright: meta.copyright || '',
            generator: meta.generator || '',
            categories: meta.categories || []
          })
          .invoke('fetchUpdates', articles)
          .done(function(feed) {
            feed.save(function(err,feed) {
              if (err) {
                deferred.reject(feed);
              }
              else {
                deferred.resolve(feed);
              }
            });
          });
        }, function(error) {
          deferred.reject(error);
        });
      });
    }
    else {
      deferred.reject('URL failed: ' + url);
    }
  });

  return deferred.promise;
};


mongoose.model('Feed', feedSchema);
