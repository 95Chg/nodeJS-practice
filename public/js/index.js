if (isLogin) {
  $('.login-btn').remove();
  $('.register-btn').remove();

  const mypageBtn = '<button type="button" class="btn btn-outline-dark mypage-btn">마이페이지</button>';
  const socketBtn = '<button type="button" class="btn btn-outline-dark socket-btn">익명채팅방</button>';
  document.querySelector('.container').insertAdjacentHTML('beforeend', mypageBtn);
  document.querySelector('.container').insertAdjacentHTML('beforeend', socketBtn);
}
$('.login-btn').click(() => {
  $(location).attr('href', `/login`);
});
$('.register-btn').click(() => {
  $(location).attr('href', `/register`);
});
$('.mypage-btn').click(() => {
  $(location).attr('href', '/mypage');
});
$('.socket-btn').click(() => {
  $(location).attr('href', '/socket');
});
