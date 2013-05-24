$(function() {
  $('body').on('click', '.js-mark-read', function() {
    var article = $(this).closest('article');
    article.addClass('read');
    $.post('/markRead/' + article.data('id'));
  });

  $('.js-unread-toggle').click(function() {
    var checked = $(this).is(':checked');
    $('article.read').toggle(!checked);
    $.get('/option/unreadOnly', {value: checked ? 1 : 0});
  });
});