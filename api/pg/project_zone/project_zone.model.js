const client = require('../../../helpers/postgresClient');
const TABLE_ZONE  = "project_zone";
const TABLE_PROJECT  = "project";
const TABLE_PARKING  = "parking";
const TABLE_EMPLOYEE  = "employee";

exports.create = function (body) {
    var query = "INSERT INTO " + TABLE_ZONE
        + " (zone_code, zone_name, zone_name_ar, perimeter, area, measurement_unit, connecting_points, project_id, created_by) " +
        " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id";
    var args = [
        body.zone_code,
        body.zone_name,
        body.zone_name_ar,
        body.perimeter,
        body.area,
        body.measurement_unit,
        body.connecting_points,
        body.project_id,
        body.created_by,
    ];
    return client.query(query, args);
};

exports.getAll = function (values) {
    var query = "SELECT * FROM " + TABLE_ZONE  + " WHERE deleted_at ISNULL AND deleted_by ISNULL ";
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    fields.forEach(x => {
        if (i == 0) query += "AND ";
        query += x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if (i < fields.length) query += " AND ";
    });
    return client.query(query, args);

};

exports.getAllByProject = function (values) {
    let query=`SELECT
            zone.*,
            project.project_name,
            concat( employee.firstname, ' ', employee.lastname) as fullname
      FROM ${TABLE_ZONE}  as zone
          LEFT JOIN ${TABLE_PROJECT} as project ON zone.project_id = project.id
          LEFT JOIN ${TABLE_EMPLOYEE} as employee ON zone.created_by = employee.employee_id`;

    const fields = Object.keys(values);
    const args = [];

    fields.forEach((field, i) => {
        if (i === 0) query += " WHERE ";
        query += "zone." + field + " = $" + (i + 1);
        args.push(values[field]);
        if (i < fields.length - 1) query += " AND ";
    });

    return client.query(query, args);
};

exports.getWithParkingsByProject = function(params) {
    let query = `SELECT zone.id as zone_id,
                zone.zone_code,
                zone.zone_name,
                zone.zone_name_ar,
                zone.perimeter,
                zone.area,
                zone.measurement_unit,
                zone.connecting_points,
                concat(employee.firstname, ' ', employee.lastname) as created_by,
                parking.id                               as parking_id,
                parking.parking_code,
                parking.name,
                parking.number,
                parking.latitude,
                parking.longitude
            FROM ${TABLE_ZONE} AS zone
              LEFT JOIN ${TABLE_EMPLOYEE} as employee on zone.created_by = employee.employee_id
              LEFT JOIN ${TABLE_PARKING} AS parking ON parking.zone_id=zone.id
            WHERE parking.project_id= $1 AND zone.project_id = $1`;

    return client.query(query, [params.project_id]);
};

exports.delete = function (id) {
    const query = `DELETE FROM ${TABLE_ZONE} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.update = function (id, body) {
    let updates = [];
    for (let field in body) {
        if (body.hasOwnProperty(field) && body[field] && field !== 'id') {
            updates.push(client.query(`UPDATE ${TABLE_ZONE} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};


exports.getZonesByProjectID = function(project_id) {
  let sql = `SELECT z.id as zone_id,
                  z.zone_code,
                  z.zone_name,
                  z.zone_name_ar,
                  z.perimeter,
                  z.area,
                  z.measurement_unit,
                  z.connecting_points
              FROM ${TABLE_ZONE} AS z
              WHERE z.deleted_at ISNULL AND z.deleted_by ISNULL AND z.project_id= $1`;

  return client.query(sql, [project_id]);
}
