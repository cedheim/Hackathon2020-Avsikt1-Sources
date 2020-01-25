const axios = require("axios");
const NATS = require("nats");
var EventSource = require('eventsource');

var nc = NATS.connect('35.228.81.230:4222');

// exports.fetch = async (req, res) => {
//     var xmlRequest = `<REQUEST>
//     <LOGIN authenticationkey="8c9689e8457e4b208c4bf29a75bf8889" />
//     <QUERY objecttype="Situation" schemaversion="1.2">
//           <FILTER>
//                 <EQ name="Deviation.MessageType" value="Olycka" />
//           </FILTER>
//           <INCLUDE>Deviation.Id</INCLUDE>
//           <INCLUDE>Deviation.Header</INCLUDE>
//           <INCLUDE>Deviation.IconId</INCLUDE>
//           <INCLUDE>Deviation.Geometry.WGS84</INCLUDE>
//     </QUERY>
// </REQUEST>`;

//     var config = {
//         headers: { 'Content-Type': 'text/xml' }
//     };

//     var response = await axios.post("https://api.trafikinfo.trafikverket.se/v2/data.json", xmlRequest, config);

//     console.log(response.data);

//     nc.publish(JSON.stringify(response.data), lll => {
//         console.log(lll);
//     });
//   };

//   exports.fetch();

//   new EventSource()

var xmlRequest = `<REQUEST>
    <LOGIN authenticationkey="8c9689e8457e4b208c4bf29a75bf8889" />
    <QUERY objecttype="Situation" schemaversion="1.2" sseurl="true">
        <FILTER>
            <NE name="Deviation.MessageType" value="Färjor" />
        </FILTER>
        <INCLUDE>Deviation.Id</INCLUDE>
        <INCLUDE>Deviation.Header</INCLUDE>
        <INCLUDE>Deviation.IconId</INCLUDE>
        <INCLUDE>Deviation.Geometry.WGS84</INCLUDE>
        <INCLUDE>Deviation.MessageType</INCLUDE>
        <INCLUDE>Deviation.Message</INCLUDE>
    </QUERY>
</REQUEST>`;


var config = {
    headers: { 'Content-Type': 'text/xml' }
};

function sendToNATS(tvBody){
    var results = tvBody.RESPONSE.RESULT;

    for(var i in results){
        var result = results[i];
        var situations = result.Situation;
        for(var j in situations){
            var situation = situations[j];
            var deviations = situation.Deviation;
            for(var k in deviations){
                var deviation = deviations[k];

                
                var wrapper = {
                    messageType: 'traffic',
                    payload: deviation
                };

                var message = JSON.stringify(wrapper);

                console.log(message);

                nc.publish('traffic', message);                
            }

        }
    }
}

axios.post("https://api.trafikinfo.trafikverket.se/v2/data.json", xmlRequest, config).then(response => {
    var resultFromTV = response.data.RESPONSE.RESULT[0];
    var url = resultFromTV.INFO.SSEURL;

    sendToNATS(response.data);

    var eventSource = new EventSource(url);
    eventSource.onmessage = (event) => {
        var json = event.data;
        var parsed = JSON.parse(json);

        sendToNATS(parsed);
    };

});


