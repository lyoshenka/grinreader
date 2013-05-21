$(function() {

  $('body').on('click', '.js-mark-read', function() {
    var article = $(this).closest('article');
    article.addClass('read');
    $.post('/markRead/' + article.data('id'));
  });
});