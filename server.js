//створення серверу з використанням наступних модулів:
let express = require('express'),
	app = express(),
	server = require('http').createServer(app), //створюється HTTP - сервер з обробником "арр" 
	io = require('socket.io').listen(server),
	game_logic = require('./game_logic'),

	port = Number(process.env.PORT || 3000);


server.listen(port, '10.0.0.178'); // зв'язує і прослуховує з'єднання на вказаному хості і порту

//маршрутизація, проміжне ПО, яке буде виконуватись для кожного запиту до додатка 
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/img", express.static(__dirname + '/img'));

app.get('/', function (req, res) { 				//направляє запити HTTP GET за вказаним шляхом з зазначеними функції зворотнього виклику.
	res.writeHead(302, { 					    //відправляє заголовок відповіді на запит (статусКод, статусПовідомлення, заголовок відповіді) 302 - временная переадресация
		'Location': '/' + generateHash(6)
	});
	res.end();
})
app.get('/:room([A-Za-z0-9]{6})', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});


function generateHash(length) {
	let haystack = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
		output = '';
	for (let i = 0; i < length; i++) {
		output += haystack.charAt(Math.floor(Math.random() * haystack.length));
	}
	return output;
};


io.sockets.on('connection', function (socket) {

	socket.on('join', function (data) {
		if (data.room in game_logic.games) {
			let game = game_logic.games[data.room];
			console.log('Гравець №2 підключився');
			socket.join(data.room);
			socket.room = data.room;
			socket.pid = 2;
			socket.hash = generateHash(8);
			game.player2 = socket;
			socket.opponent = game.player1;
			game.player1.opponent = socket;
			socket.emit('assign', { pid: socket.pid, hash: socket.hash });
			game.turn = 1;
			socket.broadcast.to(data.room).emit('start');
		} else {
			console.log('Гравець №1 підключився');
			socket.join(data.room);
			socket.room = data.room;
			socket.pid = 1;
			socket.hash = generateHash(8);
			game_logic.games[data.room] = {
				player1: socket,
				moves: 0,
				board: [[0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0]]
			};
			socket.emit('assign', { pid: socket.pid, hash: socket.hash });
		}

		socket.on('makeMove', function (data) {
			let game = game_logic.games[socket.room];
			if (data.hash = socket.hash && game.turn == socket.pid) {
				let move_made = game_logic.make_move(socket.room, data.col, socket.pid);
				if (move_made) {
					game.moves = parseInt(game.moves) + 1;
					socket.broadcast.to(socket.room).emit('move_made', { pid: socket.pid, col: data.col });
					game.turn = socket.opponent.pid;
					let winner = game_logic.check_for_win(game.board);
					if (winner) {
						io.to(socket.room).emit('winner', { winner: winner });
					}
					if (game.moves >= 42) {
						io.to(socket.room).emit('draw');
					}
				}
			}
		});

		socket.on('my_move', function (data) {
			socket.broadcast.to(socket.room).emit('opponent_move', { col: data.col });
		})

		socket.on('disconnect', function () {
			if (socket.room in game_logic.games) {
				delete game_logic.games[socket.room];
				io.to(socket.room).emit('stop');
				console.log('Кімната закрита: ' + socket.room);
			} else {
				console.log('Сервер запущений, але нічого не відбувається.');
			}
		});
	});
});