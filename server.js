#!/usr/bin/env node
const net = require('net');
const clients = []
const server = net.createServer(function(socket) {

	socket.write('Приветствуем на сервере!\r\n'); // користувач отримує це повідомлення, при підключенні до сервера

	const port = socket.remotePort; // змінна в якій зберігається порт підключеного користувача

	console.log('Client IP. Port: ', socket.remoteAddress); // у консолі сервера відображається IP підключеного користувача

	console.log('Client connected. Port: ', port); // у консолі сервера відображається порт підключеного користувача

	socket.on('close', () => {
		let index = clients.indexOf(socket);
		clients.splice(index, 1);
		console.log('Closed ', port)
	})
	clients.push(socket)
	socket.on('data', (message) => {
        		
		clients.forEach(client => {
			if (client !== socket) {
				client.write(message);
			}
		})
	})
	socket.pipe(process.stdout)
});

server.listen(6666, '10.0.0.178');
server.on('listening', () => { console.log('Listening on ', server.address()); })
/*
And connect with a tcp client from the command line using netcat, the *nix
utility for reading and writing across tcp/udp network connections.
$ netcat 127.0.0.1 1337
You should see:
> Echo server
*/