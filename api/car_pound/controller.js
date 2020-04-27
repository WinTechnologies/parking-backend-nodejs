var model = require("./model");






const get = async(req, res, next) => {
    try{
        const userlat = req.query.latitude;
        const userlon = req.query.longitude;
        
        var response = await model.getAllCarPound(req.query);

        if(response == null || response.rowCount==0) {
            return res.status(400).json({message:"No car pound for this project"});
        }
        
        var nearestCarPound;
        var nearestCarPoundDist = 50000;
        response.rows.forEach(function(carPound) {
            var dist = distance(userlat,userlon, carPound.latitude, carPound.longitude);;

            if(dist < nearestCarPoundDist) {
                nearestCarPound = carPound;
                nearestCarPoundDist = dist;
            }
        });

    }catch (e){
        return next(e);
    }
    return res.status(200).json({rows:[nearestCarPound]});
};


const distance = function(lat1, lon1, lat2, lon2){
    if((lat1==lat2) && (lon1==lon2)){
        return 0;
    } else {
        var radlat1     = Math.PI *lat1/180;
        var radlat2     = Math.PI *lat2/180;
        var radtheta    = Math.PI *(lon1 - lon2)/180;

        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
        
        dist = (Math.acos(dist))*180/Math.PI;
        return dist *60 * 1.853160;
    }
};


exports.get = get;