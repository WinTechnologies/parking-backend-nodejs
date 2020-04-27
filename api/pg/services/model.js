const postgresClient = require('../../../helpers/postgresClient');
const TABLE_SERVICE = 'service';

exports.getServices = (values) => {
  let query = `SELECT * FROM ${TABLE_SERVICE}`;
  const args = [];

  Object.keys(values).forEach((field, index, fields) => {
    if(index === 0) query += ' WHERE ';
    query += `${field} = \$${index + 1}`;
    args.push(values[field]);
    if (index < fields.length - 1) query +=  ' AND ';
  });

  return postgresClient.query(query, args);
};
