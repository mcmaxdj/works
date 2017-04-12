// Кнопка НАВЕРХ
	$('.to_top').click(function() {
		$('body,html').animate({scrollTop:0},800);
	});

	//Кнопка СДЕЛАТЬ СТАВКУ  
	$(function(){
		$('.button_bet').delay(3000).queue(function(){
			$(this).addClass('show');
		});
	});