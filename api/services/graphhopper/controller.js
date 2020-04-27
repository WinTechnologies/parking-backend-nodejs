require('browser-env')();
var graphhopper = require('graphhopper-js-api-client');
const profile_types = ['car', 'truck', 'foot'];
const ghApiKey = 'b1770ee1-63d1-4812-92fd-8a8df4140f90';
var host;


const getRoute = (req, res, next) => {
    var including_locations = req.body.points;
    var from_location = req.body.from_location;
    var to_location = req.body.to_location;
    var profile = req.body.profile;
    if (!profile) profile = "Car";
    if (!from_location || !to_location || !profile_types.includes(profile)) {
        console.log("invalid data : ", req.body);
        return res.status(404).json({message: 'Invalid data'});
    }
    const ghRouting = new GraphHopperRouting({key: ghApiKey, host: host, vehicle: profile, elevation: false, optimize: true, debug: true});
    ghRouting.addPoint(new GHInput(from_location.latitude, from_location.longitude));
    if (including_locations){
        including_locations.forEach(x=>{
            if (x.latitude && x.longitude){
                ghRouting.addPoint(new GHInput(x.latitude, x.longitude));
            }
        });
    }
    ghRouting.addPoint(new GHInput(to_location.latitude, to_location.longitude));
    ghRouting.doRequest().then(function(result){
        if (!req.device.type.toUpperCase() === "DESKTOP") {
            return res.status(200).json(result);
        } else {
            var response = {};
            response.time = result.paths[0].time;
            response.distance = result.paths[0].distance;
            response.message = "Success."
            response.points = result.paths[0].points.coordinates;
            return res.status(200).json(response);
        }

    }).catch(function(err){
        return res.status(500).json({message: 'fail', route: []});
    });
};

exports.getRoute = getRoute;