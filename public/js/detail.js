if (currentUser !== $('.edit-btn').data('user')) {
  $('.edit-btn').remove();
}
$('.edit-btn').click((e) => {
  const targetNode = $(e.target);
  const targetID = e.target.dataset.id;
  $(location).attr('href', `/edit/${targetID}`);
});
$('.list-btn').click((e) => {
  $(location).attr('href', '/list');
});
