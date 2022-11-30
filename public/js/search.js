const targetButtonObj = $('.delete-btn');
for (let i = 0; i < targetButtonObj.length; i++) {
  const target = $('.delete-btn')[i];
  if (target.dataset.user !== currentUser) target.remove();
}

$('.delete-btn').click((e) => {
  const targetNode = $(e.target);
  const targetID = e.target.dataset.id;
  $.ajax({
    method: 'DELETE',
    url: '/delete',
    data: { _id: targetID },
  })
    .done((res) => {
      console.log(res);
      targetNode.parent('li').fadeOut();
    })
    .fail((xhr, code, err) => {
      console.log(xhr, code, err);
    });
});
$('.item-title').click((e) => {
  const targetNode = $(e.target);
  const targetID = targetNode.parent('li').data('id');
  $(location).attr('href', `detail/${targetID}`);
});
$('#search').click(() => {
  const target = $('#search-input').val();
  window.location.replace(`/search?value=${target}`);
});
