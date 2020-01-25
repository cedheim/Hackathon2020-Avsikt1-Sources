const Bigtable = require('@google-cloud/bigtable');
const NATS = require("nats");

const bigtable = Bigtable();

const instance = bigtable.instance('trafficdata');
const table = instance.table('trafficdata');

var nc = NATS.connect('35.228.81.230:4222');

nc.subscribe('traffic', (message) => {
    var a = 0;

    var deserialized = JSON.parse(message);
    var payload = deserialized.payload;

    if(payload === undefined || payload['Geometry'] === undefined ||payload.Geometry["WGS84"] === undefined )
        return;

    var coordinates = payload.Geometry["WGS84"];

    var regex = /POINT.*\((\d+\.\d+)\s(\d+\.\d+)\)/i;
    var matches = coordinates.match(regex);
    payload.latitude = matches[2];
    payload.longitude = matches[1];

    var data = {
        key: payload['Id'],
        data: {
            testfamily: payload
        }
    }

    table.insert(data).then(r => {
        console.log(r);
    }).catch(err => {
        console.error(err);
    });

});

// var data = [
//     {
//         key: '123132',
//         data: {
//             "testfamily": {
//                 "message": "hello world",
//             }
//         }
//     }
// ];

// table.insert(data).then(r => {
//     console.log(r);
// }).catch(err => {
//     console.error(err);
// });
