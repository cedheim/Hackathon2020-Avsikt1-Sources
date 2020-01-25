const axios = require("axios");
const NATS = require("nats");

exports.fetch = (req, res) => {
    axios.get('http://api.luftdaten.info/v1/filter/country=SE').then(response => {
        var nc = NATS.connect('35.228.81.230:4222');
        var count = 0;

        for(var i in response.data){
            var sensorData = response.data[i];
            
            var wrapper = {
                messageType: 'luftdata',
                payload: sensorData
            }

            var message = JSON.stringify(wrapper);
            console.log(message);

            nc.publish(message)
            ++count;
        }

        nc.flush();
        nc.close();

        res.status(200).send({
            "status": `Sent ${count} messages.`
        });
    });
};
