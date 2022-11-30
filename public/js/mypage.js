$('.delete-btn').click((e) => {
  const targetNode = $(e.target);
  const targetID = e.target.dataset.id;
  if (currentUser === targetNode.data('user')) {
    $.ajax({
      method: 'DELETE',
      url: '/delete',
      data: { _id: targetID },
    })
      .done((res) => {
        targetNode.parent('li').fadeOut();
      })
      .fail((xhr, code, err) => {
        console.log(xhr, code, err);
      });
  }
});
$('.logout-btn').click((e) => {
  $(location).attr('href', `/logout`);
});
