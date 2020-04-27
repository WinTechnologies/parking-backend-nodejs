const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "project_openland";
const PROJECT_ZONE_TABLE = "project_zone";
const PROJECT_TABLE = "project";

exports.create = function (body) {
    var query = "INSERT INTO " + TABLE_NAME
        + " (land_code, land_name, perimeter, area, measurement_unit, connecting_points, project_id, zone_id, estimated_spaces, created_by) " +
        " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
    var args = [
        body.land_code,
        body.land_name,
        body.perimeter,
        body.area,
        body.measurement_unit,
        body.connecting_points,
        body.project_id,
        body.zone_id,
        body.estimated_spaces,
        body.created_by
    ];
    return client.query(query, args);
};

exports.getAll = function (values) {
    var query = "select * from " + TABLE_NAME + " ";
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    fields.forEach(x => {
        if (i == 0) query += "WHERE ";
        query += x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if (i < fields.length) query += " AND ";
    });

    return client.query(query, args);
};

exports.getAllByZone = function (values) {
    var query = "select project_openland.*, zone.zone_code, zone.zone_name, project.project_name from " +
        TABLE_NAME + " as project_openland LEFT OUTER JOIN " +
        PROJECT_TABLE + " as project ON project_openland.project_id=project.id LEFT OUTER JOIN " +
        PROJECT_ZONE_TABLE + " as zone ON project_openland.zone_id = zone.id";

    const fields = Object.keys(values);
    const args = [];

    fields.forEach((field, i) => {
        if (i == 0) query += " WHERE ";
        query += "project_openland." + field + " = $" + (i + 1);
        args.push(values[field]);
        if (i < fields.length - 1) query += " AND ";
    });

    return client.query(query, args);
};

exports.delete = function (id) {
    const query = "delete from " + TABLE_NAME + " where id = $1";
    return client.query(query, [id]);
};

exports.update = function (id, body) {
    let updates = [];
    for (let field in body) {
        if (body.hasOwnProperty(field) && body[field] && field !== 'id') {
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};

exports.getLandCode = async(req, res, next) => {
    try {
        let prefix_str;
        const project_result = await client.query("select * from project where id =  $1", [req.query.project_id]);
        const project_city = project_result.rows[0].city_name;
        const city_result = await client.query("select * from list_city where city_name =  $1", [project_city]);

        if (city_result && city_result.rows && city_result.rows[0]) {
            prefix_str = city_result.rows[0].city_code_pin;
        }

        const result = await client.query('select max(pz.zone_code) from project_openland as pol ' +
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
