/*		Pub-Sub Faye Server 		*/

//resource constants
const http = require('http'),
    faye = require('faye'),
    database = require("./resources/DBWrapper.js");

//application constants
const   databaseURL = "mongodb://localhost:27017/IBMongoDB",
        fayeServerPort = 3333;

//connect our db with the following creds
database.Connect(databaseURL);

var server = http.createServer(),
    bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});

bayeux.on('handshake', function(clientId) {
    console.log(`handshake(clientId : ${clientId})\n`);
})

bayeux.on('disconnect', function(clientId) {
  console.log(`disconnect(clientId : ${clientId})\n`);
})

bayeux.on('subscribe', function(clientId, channel) {
    console.log(`subscribe(clientId : ${clientId}, channel : ${channel}): \n`);
})

bayeux.on('unsubscribe', function(clientId, channel) {
    console.log(`unsubscribe(clientId : ${clientId}, channel : ${channel}): \n`);
})

bayeux.on('publish', function(clientId, channel, data) {
    console.log(`publish(clientId : ${clientId}, channel : ${channel}, data : ${data}): \n`);
})

bayeux.attach(server);
server.listen(fayeServerPort);

console.log(`\n\nFaye Server running on port ${fayeServerPort}\n\n`);



/*		    Server client 			*/
var serverClient = new faye.Client(`http://localhost:${fayeServerPort}/faye`);

/*      Chat Application pub/sub methods      */

serverClient.subscribe("/chat/init/send/*", function(o)
{
    const sSessionID = o.sSessionID;
    const sGUID = o.sGUID;
    const sWho = o.sWho;

    //build query
    const oChatFetchQuery = {
        sSessionID : sSessionID
    };

    //get our start and end dates
    const dtStartDate = new Date(); dtStartDate.setDate(dtStartDate.getDate() - 7);
    const dtEndDate = new Date();
    const sFieldName = "dtCreatedTime";
    const sTable = "Chat";

    //get all messages that occurred between 1 week and today
    database.FindDocumentsBetweenDates(
        oChatFetchQuery, dtStartDate, dtEndDate, sFieldName, sTable
    ).then((lstPreviousChatMessages) =>
    {
        console.log("lstPreviousChatMessages: ", lstPreviousChatMessages);
        //publish back to the sender only
        serverClient.publish(`/chat/init/receive/${sGUID}`, {
            lstPreviousChatMessages : lstPreviousChatMessages,
        });
    }, (err) => console.log(`Error while attempting to load initial chat messages ${err}`));
});

serverClient.subscribe("/chat/message/send/*", function(o)
{
    const sMessage = o.sData;
    const sGUID = o.sGUID;
    const sWho = o.sWho;
    const sSessionID = o.sSessionID;
    const dtCreatedTime = o.dtCreatedTime;

    const oDBDocument = {
        sMessage, sGUID, sWho, sSessionID, dtCreatedTime
    }
    
    //insert this message into the database for future loading
    database.Insert([oDBDocument], "Chat");

    serverClient.publish(`/chat/message/receive/${sSessionID}`, {sData : sMessage, sGUID:sGUID, sWho:sWho, dtCreatedTime:dtCreatedTime});
})

/*      Helper methods          */
