const client = require('../../../helpers/postgresClient');
const TABLE = 'terminal';

const getOne = (id) => {
    let query = `select * from ${TABLE} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.getOne = getOne;
