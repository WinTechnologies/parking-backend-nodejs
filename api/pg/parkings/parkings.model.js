const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "parking";
const PROJECT_ZONE_TABLE = "project_zone";
const PROJECT_TABLE = "project";
const PAYMENT_METHOD_TABLE = "list_payment_method";

exports.create = function (body) {
    var query = "INSERT INTO " + TABLE_NAME
        + " (number, parking_code, name, name_ar, latitude, longitude, parking_angle, parking_length, "
        + "parking_spaces, parking_dimension, is_sensors, parking_type, managed_by, "
        + "project_id, zone_id, spaces_nbr_from, spaces_nbr_to, pictures_url, info_notes, connecting_points,"
        + "functioning, restriction, payment_methods) "
        + " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)";
    var args = [
        body.number,
        body.parking_code,
        body.name,
        body.name_ar,
        body.latitude,
        body.longitude,
        body.parking_angle,
        body.parking_length,
        body.parking_spaces,
        body.parking_dimension,
        body.is_sensors,
        body.parking_type,
        body.managed_by,
        body.project_id,
        body.zone_id,
        body.spaces_nbr_from,
        body.spaces_nbr_to,
        body.pictures_url,
        body.info_notes,
        body.connecting_points,
        body.functioning,
        body.restriction,
        body.payment_methods
    ];
    return client.query(query, args);
};

exports.getAllWithZones = function (values) {
    let query = `select parking.*, zone.zone_code, zone.zone_name, project.project_name from ${TABLE_NAME} parking, ${PROJECT_ZONE_TABLE} zone, ${PROJECT_TABLE} project`;
    query += ` where parking.zone_id = zone.id AND parking.project_id = project.id`;

    const fields = Object.keys(values);
    const args = [];

    fields.forEach((field, i) => {
        if (i < fields.length) query += " AND ";
        query += "parking." + field + " = $"+ (i + 1);
        args.push(values[field]);
        i++;
    });
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

exports.getAllWithDetails = function (values) {
    var query = "select parking.*, zone.zone_name, project.project_name from " +
        TABLE_NAME + " as parking LEFT OUTER JOIN " +
        PROJECT_ZONE_TABLE + " as zone ON parking.zone_id = zone.id LEFT OUTER JOIN " +
        PROJECT_TABLE + " as project ON parking.project_id=project.id";

    const fields = Object.keys(values);
    const args = [];

    fields.forEach((field, i) => {
        if (i == 0) query += " WHERE ";
        query += "parking." + field + " = $" + (i + 1);
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
        if (body.hasOwnProperty(field) &&  field !== 'id') {
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};

exports.getNumber = async function (values) {
    let parkingNumber = 1;
    const zone_id = values['zone_id'];
    const project_id = values['project_id'];
    try {
        const parkings = await client.query("select max(number) from parking where zone_id = $1 and project_id = $2", [zone_id, project_id]);
        if (parkings && parkings.rows && parkings.rows[0]) {
            const code = parkings.rows[0].max;
            parkingNumber = Number(code) + 1;
        }
    } catch (e) {

    }

    return Promise.resolve(parkingNumber);
}

exports.getParkingCode = async function (values) {

    let parkingCode = '0000000001';
    const zone_id = values['zone_id'];
    // const project_id = values['project_id'];

    try {
        const zones = await client.query("select * from project_zone where id = $1", [zone_id]);
        if (zones && zones.rows) {
            const zone_code = zones.rows[0].zone_code;
            let number = 0;
            // const parkings = await client.query("select max(parking_code) from parking where zone_id = $1 and project_id = $2", [zone_id, project_id]);
            const parkings = await client.query("select max(parking_code) from parking where zone_id = $1", [zone_id]);
            if (parkings && parkings.rows && parkings.rows[0]) {
                const code = parkings.rows[0].max;
                if (code && code.length > 4) {
                    number = Number(code.substring(code.length - 4, code.length)) + 1;
                }
            }
            const format_number = ("0000" + number).slice(-4);
            parkingCode = zone_code + format_number
        }

    } catch (e) {

    }

    return Promise.resolve(parkingCode);
}

exports.getPaymentMethods = () => {
    const query = 'select * from ' + PAYMENT_METHOD_TABLE;

    return client.query(query, []);
}
