const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "parkfolio.fleet_data2";

exports.get = () => {
    const query = `select distinct on (devid) * from ${TABLE_NAME} order by devid, tremtime desc`;
    return client.query(query, []);
};
