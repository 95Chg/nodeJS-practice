$('.register-btn').click((e) => {
  const id = $('register_id').val();
  const password = $('.register_password').val();
  if (id.length === 0 || password.length === 0) {
    alert('회원가입할 아이디와 비밀번호를 모두 입력하세요.');
    e.preventDefault();
  }
});
