// отображение подсказки рядос с кнопкой при наведении (tooltip)
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
}),

$(function () {
  $('[data-toggle="popover"]').popover()
}),

$('#myModal').modal({
  keyboard: false
})