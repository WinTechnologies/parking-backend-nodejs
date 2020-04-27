const model = require('./project_zone.model');
const client = require('../../../helpers/postgresClient');

const create = async (req, res, next) => {
    const body = {...req.body, created_by: req._user.employee_id};
    model.create(body).then(result => {
        if (result.rows.length === 1) {
            return res.status(201).json({message: 'created.', id: result.rows[0].id});
        }
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getAll = (req, res, next) => {
    model.getAll(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};


const getAllByProject = (req, res, next) => {
    model.getAllByProject(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getWithParkingsByProject = async (req, res, next) => {
    try {
        if (!req.query.project_id) {
            return res.status(400).json({message: 'Invalid data'});
        }
        const result = await model.getWithParkingsByProject(req.query);

        let zones = {};
        result.rows.forEach(element => {
            if (!zones[element.id]) {
                zones[element.id] = {
                    id: element.parking_id,
                    zone_name: element.zone_name,
                    zone_id: element.zone_id,
                    zone_code: element.zone_code,
                    connecting_points: element.connecting_points,
                    list: []
                }
            }
            if (element.parking_id) {
                zones[element.id].list.push(element);
            }
        });

        return res.status(200).json(Object.values(zones));
    } catch (err) {
        return res.status(400).json({message: err.message});
    }
};

const getZoneCode = async(req, res, next) => {
    try {
        let prefix_str;
        const project_result = await client.query("select * from project where id =  $1", [req.query.project_id]);
        const project_city = project_result.rows[0].city_name;
        const city_result = await client.query("select * from list_city where city_name =  $1", [project_city]);

        if (city_result && city_result.rows && city_result.rows[0]) {
            prefix_str = city_result.rows[0].city_code_pin;
        }

        const result = await client.query('select max(pz.zone_code) from project_zone as pz ' +
                                            'join project as p on p.id = pz.project_id ' +
                                            'where  p.city_name = $1', [project_city]);

        let number = 1;
        if (result && result.rows && result.rows[0]) {
            const code = result.rows[0].max;
            if (code && code.length > 3) {
                number = Number(code.substring(code.length - 3, code.length)) + 1;
            }
        }
        const format_number = ("000" + number).slice(-3);
        let zone_code = prefix_str + format_number;
        return res.status(200).json(zone_code);

    }
    catch(e) {
        return res.status(400).json({message: e.message});
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        if (id) {
            return model.getAll({id: id})
                .then(result => {
                    if (result && result.rows && result.rows[0]) {
                        return model.update(id, req.body)
                            .then(Updated => {
                                return res.status(202).json({message: 'updated.'});
                            });
                    } else {
                        throw new Error('Invalid data.');
                    }
                });
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
            return model.delete(id).then(deleted => {
                return res.status(200).json({message: 'deleted.'});
        });
        } else return res.status(202).json({error: 'Invalid data.'});
    });
    }
};

const getZonesByProjectID = async (req, res, next) => {
    try {
        if (!req.query.project_id) {
            return res.status(400).json({message: 'Missing project_id query!'});
        }
        const result = await model.getZonesByProjectID(req.query.project_id);
        let zones = [];
        result.rows.forEach(element => {
              const parkZone =  {
                  id: element.zone_id,
                  zone_name: element.zone_name,
                  zone_id: element.zone_id,
                  zone_code: element.zone_code,
                  connecting_points: element.connecting_points,
                  list: []
              };
              zones.push(parkZone);
        });

        return res.status(200).json(Object.values(zones));
    } catch (err) {
        return res.status(400).json({message: err.message});
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getAllByProject = getAllByProject;
exports.getWithParkingsByProject = getWithParkingsByProject;
exports.getZonesByProjectID = getZonesByProjectID;
exports.getZoneCode = getZoneCode;
exports.update = update;
exports.del = del;
