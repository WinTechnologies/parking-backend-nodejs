const moment = require("moment");
const towVehicleModel = require("./towVehicule.model");

const getUsersWithAssignedTowVehicles = users => {
  let usersWithVehicle = users.filter(user => {
    let deav = user.except_assigned_vehicle;
    let deavO;
    try {
      deavO = JSON.parse(deav);
    } catch (e) {
    }

    let dav = user.assigned_vehicle;
    let davO;
    try {
      davO = JSON.parse(dav);
    } catch (e) {
    }

    if (
      deavO &&
      moment(deavO.start_date, moment.ISO_8601).isValid() &&
      moment(deavO.end_date, moment.ISO_8601).isValid()
    ) {
      if (
        moment(deavO.start_date).isBefore(moment().toISOString()) &&
        moment(deavO.end_date).isAfter(moment().toISOString())
      ) {
        user.assigned_vehicle_id = deavO.vehicle_id;
        return true;
      }
    }

    if (
      !davO ||
      !moment(davO.start_date, moment.ISO_8601).isValid() ||
      !moment(davO.end_date, moment.ISO_8601).isValid()
    )
      return false;

    if (
      moment(davO.start_date).isBefore(moment().toISOString()) &&
      moment(davO.end_date).isAfter(moment().toISOString())
    ) {
      user.assigned_vehicle_id = davO.vehicle_id;
      return true;
    }

    return false;
  });

  return usersWithVehicle;
};

const getAssignedTowVehiclesIDs = (users) => {

  let users_on_street = getUsersWithAssignedTowVehicles(users);
  let assigned_tow_vehicles_ids = users_on_street.map(user => {
    return user.assigned_vehicle_id;
  });

  // Get unique assigned tow vehicle id that exist in tow vehicle table.
  assigned_tow_vehicles_ids = assigned_tow_vehicles_ids.filter(
    (value, index, self) => {
      return (
        self.indexOf(value) === index
      );
    }
  );

  return assigned_tow_vehicles_ids;
};

const getByProject = async (req,res,next) => {
  const projectId = req.query.project_id;
  const type_asset = req.query.type_asset;
  if (projectId) {
    try {
      const towTruckAvailable = await towVehicleModel.getByProject({projectId: parseInt(projectId), type_asset: type_asset});
      return res.status(200).json(towTruckAvailable.rows);
    } catch (e) {
      next(e);
    }
  } else {

  }
};

const assignTowVehicle = async (req,res,next) => {
  const asset = req.body.asset;
  const user = req.body.user;

  try {
    var vehicle = await towVehicleModel.getAll({id:asset.codification_id});
    if(vehicle!= null && vehicle.rowCount>0 && vehicle.rows[0].status_vehicle === 'Active'){
      return res.status(409).json({ message: "This vehicle is already assigned." });
    }
    const asign = await towVehicleModel.assignTowTruck({asset: asset, user : user});
    return res.status(202).json({ message: "success." });
  } catch (error) {
    next(error);
  }
};

const unassignTowVehicle = async (req,res,next) => {
  try {
    const asset = req.body.asset;
    const user = req.body.user;
    const assign = await towVehicleModel.unAssignTowTruck({ asset: asset, user : user });
    return res.status(200).json({ message: 'success.' });
  } catch (error) {
    next(error);
  }
};

const getOne = (req, res, next) => {
  towVehicleModel
    .getAll({ id: req.params.id })
    .then(result => {
      let asset = result.rows && result.rows[0] ? result.rows[0] : {};
      return res.status(200).json(asset);
    })
    .catch(err => {
      next(err);
    });
};

exports.getByProject = getByProject;
exports.assignTowVehicle = assignTowVehicle;
exports.unassignTowVehicle = unassignTowVehicle;
exports.getOne = getOne;
