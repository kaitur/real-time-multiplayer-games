var net = require('net');
var client = new net.Socket();
client.on('close', function() {
	console.log('Connection closed');
});
/*
client.on('data', function(data) {
	console.log('Received: ' + data);
	client.destroy(); // kill client after server's response
});
*/
client.on('data', function(data) {
    console.log(data.toString());
    client.end();
 });
client.connect(6666, '10.0.0.178', function() {
	console.log('Connected');
	client.write('Hello, server! Love, Client.');
});