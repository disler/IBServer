/*		Pub-Sub Faye Server 		*/

var http = require('http'),
    faye = require('faye'),
    port = 3333;

var server = http.createServer(),
    bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});

bayeux.on('handshake', function(clientId) {
  console.log(`handshake(clientId : ${clientId})`);
})

bayeux.on('disconnect', function(clientId) {
  console.log(`disconnect(clientId : ${clientId})`);
})

bayeux.on('subscribe', function(clientId, channel) {
  console.log(`subscribe(clientId : ${clientId}, channel : ${channel}): `);
})

bayeux.on('unsubscribe', function(clientId, channel) {
  console.log(`unsubscribe(clientId : ${clientId}, channel : ${channel}): `);
})

bayeux.on('publish', function(clientId, channel, data) {
  console.log(`publish(clientId : ${clientId}, channel : ${channel}, data : ${data}): `);
})

bayeux.attach(server);
server.listen(port);

console.log(`\n\nServer running on port ${port}\n\n`);



/*		Server client 			*/
var serverClient = new faye.Client(`http://localhost:${port}/faye`);
serverClient.publish("/start", {sData:"hello"});
serverClient.subscribe(`/start`, function(o)
{
	console.log(`/start() returned ->  ${o.sData}`);
});

serverClient.subscribe("/message/send", function(o)
{
	const sMessage = o.sData;
	serverClient.publish("/message/receive", {sData : sMessage});
})