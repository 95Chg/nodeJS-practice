var target;
var eventSource;

$('.list-group-item').click(function (e) {
  target = $(this).data('chat_room_number');
  $('#send').css('display', 'inline-block');
  $('#chat-input').css('display', 'block');
  $('.chat-content').html('');

  $('.selected').removeClass('selected');
  if (!$(this).hasClass('selected')) {
    $(this).addClass('selected');
  } else {
    $(this).removeClass('selected');
  }
  if (eventSource !== undefined) {
    eventSource.close();
  }
  eventSource = new EventSource(`/message/${target}`);
  eventSource.addEventListener('message', (e) => {
    const messageData = JSON.parse(e.data);
    messageData.forEach((message) => {
      if (currentUser === message.user_name) $('.chat-content').append(`<li><span class="chat-box mine">${message.content}</span></li>`);
      else $('.chat-content').append(`<li><span class="chat-box">${message.content}</span></li>`);
    });
  });
});

$('#send').click((e) => {
  const message = {
    parent: target,
    content: $('#chat-input').val(),
  };
  if (message.parent && message.content) {
    $.ajax({
      method: 'POST',
      url: '/message',
      data: message,
    }).done(() => {
      $('#chat-input').val('');
    });
  } else alert('채팅방 선택 후 메세지를 입력해주세요');
});
$('#chat-input').keydown((key) => {
  const message = {
    parent: target,
    content: $('#chat-input').val(),
  };
  if (key.keyCode == 13) {
    if (message.parent && message.content) {
      $.ajax({
        method: 'POST',
        url: '/message',
        data: message,
      }).done(() => {
        $('#chat-input').val('');
      });
    } else alert('채팅방 선택 후 메세지를 입력해주세요');
  }
});
