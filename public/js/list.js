const deleteButtonObj = $('.delete-btn');
for (let i = 0; i < deleteButtonObj.length; i++) {
  const target = $('.delete-btn')[i];
  if (target.dataset.user !== currentUser) target.style.display = 'none';
}
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

const chatButtonObj = $('.chat-btn');
for (let i = 0; i < chatButtonObj.length; i++) {
  const target = $('.chat-btn')[i];
  if (target.dataset.user === currentUser) target.style.display = 'none';
}
$('.chat-btn').click((e) => {
  const targetNode = $(e.target);
  const postNumber = e.target.dataset.id;
  const postTitle = targetNode.siblings('.item-title').text();
  const chatPartner = e.target.dataset.user;
  if (currentUser !== targetNode.data('user') && e.target.dataset.id == postNumber) {
    $.ajax({
      method: 'POST',
      url: '/chatroom',
      data: {
        chatPartner: chatPartner,
        postNumber: postNumber,
        postTitle: postTitle,
      },
    })
      .done((res) => {
        window.location.replace(`/chat`);
      })
      .fail((xhr, code, err) => {
        console.log(xhr, code, err);
      });
  }
});

$('.item-title').click((e) => {
  const targetNode = $(e.target);
  const targetID = targetNode.parent('li').data('id');
  window.location.replace(`/detail/${targetID}`);
});
$('#search').click(() => {
  const target = $('#search-input').val();
  window.location.replace(`/search?value=${target}`);
});
