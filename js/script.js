$(function () {
	let socket = io.connect(),
		player = {},
		yc = $('.your_color'),
		oc = $('.opponent_color'),
		your_turn = false,
		url = window.location.href.split('/'),
		room = url[url.length - 1];

	let text = {
		'yt': "Твоя черга ходити!",
		'nyt': "Очікування ходу противника.",
		'popover_h2': "Очікування опонента :)",
		'popover_p': "Відправте посилання другу, щоб зіграти разом.",
		'popover_h2_win': "Ти переміг, вітаємо!",
		'popover_p_win': "Відправте посилання другу, щоб зіграти разом.",
		'popover_h2_lose': "Ти програв, спробуй ще раз.",
		'popover_p_lose': "Відправте посилання другу, щоб зіграти разом.",
		'popover_h2_draw': "Нічія, оце так!",
		'popover_p_draw': "Відправте посилання другу, щоб зіграти разом.",
	}

	init();

	socket.on('assign', function (data) {
		player.pid = data.pid;
		player.hash = data.hash;
		if (player.pid == "1") {
			yc.addClass('red');
			oc.addClass('yellow');
			player.color = 'red';
			player.oponend = 'yellow';
			$('.underlay').removeClass('hidden');
			$('.popover').removeClass('hidden');
		} else {
			$('.status').html(text.nyt);
			yc.addClass('yellow');
			oc.addClass('red');
			oc.addClass('show');
			player.color = 'yellow';
			player.oponend = 'red';
		}
	});

	socket.on('winner', function (data) {
		oc.removeClass('show');
		yc.removeClass('show');
		change_turn(false);
		for (let i = 0; i < 4; i++) {
			$('.cols .col .coin#coin_' + data.winner.winner_coins[i]).addClass('winner_coin');
		}

		if (data.winner.winner == player.pid) {
			$('.popover h2').html(text.popover_h2_win);
			$('.popover p').html(text.popover_p_win);
		} else {
			$('.popover h2').html(text.popover_h2_lose);
			$('.popover p').html(text.popover_p_lose);
		}

		setTimeout(function () {
			$('.underlay').removeClass('hidden');
			$('.popover').removeClass('hidden');
		}, 2000);
	});

	socket.on('draw', function () {
		oc.removeClass('show');
		yc.removeClass('show');
		change_turn(false);
		$('.popover h2').html(text.popover_h2_draw);
		$('.popover p').html(text.popover_p_draw);
		setTimeout(function () {
			$('.underlay').removeClass('hidden');
			$('.popover').removeClass('hidden');
		}, 2000);
	});

	socket.on('start', function (data) {
		change_turn(true);
		yc.addClass('show');
		$('.underlay').addClass('hidden');
		$('.popover').addClass('hidden');
	});

	socket.on('stop', function (data) {
		init();
		reset_board();
	});

	socket.on('move_made', function (data) {
		make_move(data.col + 1, true);
		change_turn(true);
		yc.addClass('show');
		oc.removeClass('show');
	});

	socket.on('opponent_move', function (data) {
		if (!your_turn) {
			oc.css('left', parseInt(data.col) * 100);
		}
		console.debug(data);
	});

	$('.cols > .col').mouseenter(function () {
		if (your_turn) {
			yc.css('left', $(this).index() * 100);
			socket.emit('my_move', { col: $(this).index() });
		}
	});

	$('.cols > .col').click(function () {
		if (parseInt($(this).attr('data-in-col')) < 6) {
			if (your_turn) {
				let col = $(this).index() + 1;
				make_move(col);
				socket.emit('makeMove', { col: col - 1, hash: player.hash });
				change_turn(false);
				yc.removeClass('show');
				oc.addClass('show');
			}
		}
	});

	function make_move(col, other) {
		if (!other) other = false;
		let col_elm = $('.cols > .col#col_' + col);
		let current_in_col = parseInt(col_elm.attr('data-in-col'));
		col_elm.attr('data-in-col', current_in_col + 1);
		let color = (other) ? player.oponend : player.color;
		let new_coin = $('<div class="coin ' + color + '" id="coin_' + (5 - current_in_col) + '' + (col - 1) + '"></div>');
		col_elm.append(new_coin);
		new_coin.animate({
			top: 100 * (4 - current_in_col + 1),
		}, 400);
	}

	function init() {
		socket.emit('join', { room: room });
		$('.popover input').val(window.location.href);
		$('.popover h2').html(text.popover_h2);
		$('.popover p').html(text.popover_p);
		$('.status').html('');
	}

	function reset_board() {
		$('.cols .col').attr('data-in-col', '0').html('');
		yc.removeClass('yellow red');
		oc.removeClass('yellow red');
		yc.removeClass('show');
		oc.removeClass('show');
	}

	function change_turn(yt) {
		if (yt) {
			your_turn = true;
			$('.status').html(text.yt);
		} else {
			your_turn = false;
			$('.status').html(text.nyt);
		}
	}

	$('.popover input').click(function () {
		$(this).select();
	});

});