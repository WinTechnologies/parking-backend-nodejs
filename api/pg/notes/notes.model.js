const client = require('../../../helpers/postgresClient');
const NOTE_TABLE = 'note';
const EMPLOYEE_TABLE = 'employee';
const PROJECT_TABLE = 'project';

exports.create = function(body, created_by) {
    let query = `insert into ${NOTE_TABLE} ( 
        created_by,
        sent_to,
        type_note,
        remarks,
        project_id)
        values ( $1, $2, $3, $4, $5)`;

    const args = [
        created_by,
        body.sent_to,
        body.type_note,
        body.remarks,
        body.project_id,
    ];

    return client.query(query, args);
};

exports.getAll = function (values) {
    let query = `select * from ${NOTE_TABLE} WHERE deleted_at is null AND deleted_by is null `;
    const args = [];
    Object.keys(values).forEach((field, index, fields) => {
        query += ` AND ${field} = \$${index+1} `;
        args.push(values[field]);
    });
    return client.query(query, args);
};

exports.getOne = function (id){
    const query = `select * from ${NOTE_TABLE} where id = $1 AND deleted_at is null AND deleted_by is null`;
    return client.query(query, [id]);
};

exports.getEmployeeNotes = function(employee_id) {
    const query = `select ${NOTE_TABLE}.*, ${EMPLOYEE_TABLE}.firstname, ${EMPLOYEE_TABLE}.lastname, ${PROJECT_TABLE}.project_name 
    from ${NOTE_TABLE} 
    left join ${EMPLOYEE_TABLE} on ${NOTE_TABLE}.created_by = ${EMPLOYEE_TABLE}.employee_id
    left join ${PROJECT_TABLE} on ${NOTE_TABLE}.project_id = ${PROJECT_TABLE}.id
    where sent_to = $1 AND ${NOTE_TABLE}.deleted_at is null AND ${NOTE_TABLE}.deleted_by is null`;
    return client.query(query, [employee_id]);
};

exports.update = (id, body) => {
  let updates = [];
  for (let field in body){
      if(body.hasOwnProperty(field) && body[field] && field !== 'id') {
          updates.push(client.query(`update ${NOTE_TABLE} set ${field} = $1 where id = $2`, [body[field], id]));
      }
  }
  return Promise.all(updates);
};

exports.delete = (id, deleted_by) => {
    const query = `update ${NOTE_TABLE} set deleted_at = current_timestamp, deleted_by = $1 where id = $2`;
    return client.query(query, [deleted_by, id]);
};
