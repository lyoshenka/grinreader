$(function() {
  $("[data-toggle='tooltip']").tooltip(); // enable tooltips

  $('article:visible').first().addClass('active'); // first visible article is active

  var xor = function(a,b) {
    return !a != !b;
  };


  var readUnread = function(article, read) {
    // id can be an article element or a string
    //var article = !!id.nodeName ? id : $('article[data-id="' + id +'"]');
    read = read ? 1 : 0;
    if (article && article.is('article') && xor(read, article.hasClass('read'))) {
      article.toggleClass('read', read);
      $.get('/feed/readStatus/' + article.data('id'), {
        value: read
      });
    }
  };

  var loadFeed = function(url, pushState) {
    if (typeof pushState === 'undefined')
    {
      pushState = true;
    }
    $('#loading').show();
    window.scrollTo(0,0);
    $.get(url, function(data) {
      if (pushState)
      {
        history.pushState({url: url}, 'Reader', url);
      }
      $('.js-feed-content').html(data).find('article').first().addClass('active');
      $('#loading').hide();
    });
  };

  $(window).on('popstate', function (e) {
    loadFeed(e.originalEvent.state.url, false);
  });

  $('body').on('click', 'a', function(eventObject) {
    var anchor = $(this);
    if (anchor.data('confirm') && !confirm(anchor.data('confirm')))
    {
      return false;
    }

    if (anchor.hasClass('js-mark-read'))
    {
      readUnread(anchor.closest('article'), true);
    }

    if (anchor.hasClass('js-scroll-to-top'))
    {
      window.scrollTo(0,0);
    }
 
    if (anchor.hasClass('js-load-ajax'))
    {
      eventObject.preventDefault();
      loadFeed(anchor.attr('href'));
    }
 });


  $('.js-unread-toggle a').click(function() {
    if ($(this).hasClass('js-all') || $(this).hasClass('js-unread')) {
      var control = $(this).closest('.js-unread-toggle'),
          currentVal = control.data('unread-only') ? 1 : 0,
          newVal = $(this).hasClass('js-unread') ? 1 : 0;
      if (!currentVal != !newVal) { // XOR
        control.data('unread-only', newVal);
        control.find('.js-button-text').html($(this).text());
        $('article.read').toggle(!newVal);
        $.get('/option/unreadOnly', {value: newVal});
      }
    }
  });

  var prevNext = function(direction) {
    var curr = $('article.active'),
        next = direction == 'next' ?
               curr.nextAll('article:visible').first() :
               curr.prevAll('article:visible').first();

    if (next.is('article')) {
      curr.removeClass('active');
      next.addClass('active');
      next.parents().scrollTop(next.offset().top);
    }
    if (direction == 'next') {
      readUnread(curr, true);
    }
  };

  Mousetrap.bind('n', function() {
    prevNext('next');
  }, 'Next article in feed.');

  Mousetrap.bind('p', function() {
    prevNext('prev');
  }, 'Previous article in feed.');

  Mousetrap.bind('u', function() {
    readUnread($('article.active'), false);
  }, 'Mark current article as unread.');

  Mousetrap.bind('t', function() {
    window.scrollTo(0,0);
  }, 'Scroll to top.');
});
