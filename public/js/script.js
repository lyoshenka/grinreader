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

  $('body').on('click', 'a', function() {
    var anchor = $(this);
    if (anchor.data('confirm') && !confirm(anchor.data('confirm')))
    {
      return false;
    }

    if (anchor.hasClass('js-mark-read'))
    {
      readUnread(anchor.closest('article'), true);
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
  });

  Mousetrap.bind('p', function() {
    prevNext('prev');
  });

  Mousetrap.bind('u', function(){
    readUnread($('article.active'), false);
  })
});