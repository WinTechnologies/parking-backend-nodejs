const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost');
const { MqttSubject } = require('../../contravention/constants');
const TOPICS = Object.values(MqttSubject);

client.on('connect', function () {
    TOPICS.forEach(x=>{
       client.subscribe(x);
    });
});

exports.client = client;
