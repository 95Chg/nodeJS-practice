$('.edit-btn').click((e) => {
  const title = $('#toDoList_title').val();
  const date = $('#toDoList_date').val();
  if (title.length === 0 || date.length === 0) {
    alert('글과 날짜를 모두 입력하세요.');
    e.preventDefault();
  }
});
