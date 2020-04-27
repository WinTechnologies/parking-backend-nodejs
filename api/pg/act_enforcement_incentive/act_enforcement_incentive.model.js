const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "act_enforcement_incentive";
const TABLE_PROJECT = "project";

exports.create = function(body) {

    let column = "";
    for(let field in body) {
        column+= field + ', ';
    }
    column = column.substring(0, column.length - 2);

    var query = '';

    if(body.manager_type){
        query = "INSERT INTO " + TABLE_NAME + " (" + column + ") " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ) RETURNING *";
    }
    else
        query = "INSERT INTO " + TABLE_NAME + " (" + column + ") " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";

    var args = [
        body.project_id,
        body.job_position,
        body.incentive_category,
        body.incentive_name,
        body.workplan,
        body.incentive_type,
        body.option,
        body.incentive_unity,
        body.calculation_type
    ];

    if(body.manager_type)
        args.push(body.manager_type);

    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = "select aei.* from " + TABLE_NAME + " AS aei ";
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    query += "INNER JOIN " + TABLE_PROJECT + " AS project ON aei.project_id = project.id AND project.deleted_at IS NULL ";

    fields.forEach(x => {
        if(i === 0) query += "WHERE ";
        query += "aei." + x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) query += " AND ";
    });
    return client.query(query, args);
};

exports.get = function(project_id) {
    var query = "select * from " + TABLE_NAME + " where project_id = $1 " ;
    return client.query(query, [project_id]);
};

exports.delete = function(id) {
    const query = "delete from " + TABLE_NAME + " where id = "+ id;
    return client.query(query);
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
