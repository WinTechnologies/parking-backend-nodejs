var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://192.168.1.79");
client.on("connect", function() {
  client.subscribe("newjob");
});
client.on("message", function(topic, message) {
  context = message.toString();
});
