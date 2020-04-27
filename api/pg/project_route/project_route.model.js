const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "project_route";
const EMPLOYEE_TABLE = "employee";
const PROJECT_TABLE = "project";

exports.create = function(body, created_by) {
    var query = "INSERT INTO " + TABLE_NAME
    + " (route_code, route_name, distance_mins, distance_meters, connecting_points, project_id, staffs, created_by) " +
    " VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";
    var args = [
        body.route_code,
        body.route_name,
        body.distance_mins,
        body.distance_meters,
        body.connecting_points,
        body.project_id,
        body.staffs,
        created_by
    ];
    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = `SELECT route.*, project.project_name as project_name FROM ${TABLE_NAME} route `;
    query += ` LEFT JOIN ${PROJECT_TABLE} project on route.project_id = project.id `;
    const fields = Object.keys(values);
    const args = [];

    query+=' WHERE route.deleted_at is null AND route.deleted_by is null ';
    fields.forEach((x, i) => {
        query += ` AND route.${x} = $${i + 1}`;
        args.push(values[x]);
    });
    return client.query(query, args);

};

exports.getStaffsById = function(id) {
    let query = `SELECT employee.* \
                FROM ${EMPLOYEE_TABLE} employee  
                WHERE employee.employee_id in (
                    select unnest(route.staffs)
                        from ${TABLE_NAME} route
                       where route.id = $1
                    )
                --- AND employee.deleted_at is null AND employee.deleted_by is null`;
    return client.query(query, [id]);

};

exports.delete = function(id, deleted_by) {
    const query = `update ${TABLE_NAME} set deleted_at = current_timestamp, deleted_by = $1 where id = $2`;
    return client.query(query, [deleted_by, id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'id'){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};