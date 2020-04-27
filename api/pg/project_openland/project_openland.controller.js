const model = require('./project_openland.model');
const client = require('../../../helpers/postgresClient');

const create = async (req, res, next) => {
    model.create(req.body).then(result => {
        return res.status(201).json({message: 'created.'});
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

const getAllByZone = (req, res, next) => {
    model.getAllByZone(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const update = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(202).json({message: 'updated.'});
                });
            } else return res.status(202).json({error: 'Invalid data.'});
        });
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
            return model.delete(id).then(deleted => {
                return res.status(202).json({message: 'deleted.'});
        });
        } else return res.status(202).json({error: 'Invalid data.'});
    });
    }
};

const getLandCode = async(req, res, next) => {
    try {
        let prefix_str;
        const project_result = await client.query("select * from project where id =  $1", [req.query.project_id]);
        const project_city = project_result.rows[0].city_name;
        const city_result = await client.query("select * from list_city where city_name =  $1", [project_city]);

        if (city_result && city_result.rows && city_result.rows[0]) {
            prefix_str = city_result.rows[0].city_code_pin;
        }

        const result = await client.query('select max(pol.land_code) from project_openland as pol ' +
                                            'join project as p on p.id = pol.project_id ' +
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


exports.create = create;
exports.getAll = getAll;
exports.getAllByZone = getAllByZone;
exports.getLandCode = getLandCode;
exports.update = update;
exports.del = del;