const socket = io();

$('.list-group-item').click(function (e) {
  $('.chat-room-title').css('display', 'none');
  $('.selected').removeClass('selected');
  if (!$(this).hasClass('selected')) {
    $(this).addClass('selected');
  } else {
    $(this).removeClass('selected');
  }
});

$('.list-group-item.big-room').click(function (e) {
  $('.chat-room.small-room').css('display', 'none');
  $('.chat-room.big-room').css('display', 'block');
});

$('#big-input').keydown((key) => {
  const message = $('#big-input').val();
  if (key.keyCode == 13) {
    socket.emit('big-send', message);
    $('#big-input').val('');
  }
});
$('#big-send').click(() => {
  const message = $('#big-input').val();
  socket.emit('big-send', message);
  $('#big-input').val('');
});

$('.small-room').click(function (e) {
  $('.chat-room.big-room').css('display', 'none');
  $('.chat-room.small-room').css('display', 'block');
  socket.emit('joinRoom');
});

$('#small-input').keydown((key) => {
  const message = $('#small-input').val();
  if (key.keyCode == 13) {
    socket.emit('small-send', message);
    $('#small-input').val('');
  }
});
$('#small-send').click(() => {
  const message = $('#small-input').val();
  socket.emit('small-send', message);
  $('#small-input').val('');
});

socket.on('broadcast', (data) => {
  $('.list-group.chat-content.big-room').append(`<li><span class="chat-box mine">${data}</span></li>`);
});
socket.on('small-chat', (data) => {
  $('.list-group.chat-content.small-room').append(`<li><span class="chat-box mine">${data}</span></li>`);
});
