const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "project_keydate";
exports.create = function(body) {
    var query = "INSERT INTO " + TABLE_NAME +
    " ( task_id, task_name, allday, start_date, end_date, repeat, remarks, project_id )"
    +" VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
    var args = [
        body.task_id,
        body.task_name,
        body.allday,
        body.start_date,
        body.end_date,
        body.repeat,
        body.remarks,
        body.project_id
    ];

    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = "select * from " + TABLE_NAME + " ";
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    fields.forEach(x => {
        if(i == 0) query += "WHERE ";
        query += x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) query += " AND ";
    });
    return client.query(query, args);

};

exports.delete = function(id) {
    const query = "delete from " + TABLE_NAME + " where id = $1";
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field]!== null && field !== 'id'){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};

exports.check = function(task_name) {
    const query = "SELECT EXISTS (SELECT 1 FROM " + TABLE_NAME + " WHERE task_name= $1 )";
    return client.query(query, [task_name]);
}