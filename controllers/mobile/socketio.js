var jwt_decode = require('jwt-decode');
var server = require('../../bin/www');
var users = require('../../bin/www').users;

const sync_position = (req, res, next) =>  {
    var decoded = req._user;
    decoded['mapdata'] = "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"properties\":{\"userType\":\""+decoded.usertype+"\",\"markerIconsPath\":\"/assets/user-icons/\", \"user_id\":\""+decoded.id+"\"},\"geometry\":{\"type\":\"Point\",\"coordinates\":["+req.body.longitude+","+req.body.latitude+"]}}]}";
    server.io.sockets.emit('update_position', decoded);
    return res.send({response: 'success'});
};

exports.sync_position = sync_position;

