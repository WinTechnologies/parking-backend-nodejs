const client = require('../../../../helpers/postgresClient');

const get = () => {
    return new Promise(resolve => resolve('works!'));
};

exports.get = get;