const config = require('../config/postgres');
const pg = require('pg');

const pool = new pg.Pool({
    host: config.PGHOST,
    user: config.PGUSER,
    database: config.PGDATABASE,
    password: config.PGPASSWORD,
    port: config.PGPORT
});
  
pool.connect(function(err, result){
    console.info(`Server connected to postgres / database: ${config.PGHOST}/${config.PGDATABASE}`);
});

pool.addSearchByParams = (query, params) => {
    const fields = Object.keys(params);
    const args = [];

    fields.forEach((field, index, fields) => {
        if (index === 0) {
            query+="WHERE "
        }
        query += index < (fields.length-1) ? `${field} = \$${index+1} AND ` : `${field} = \$${index+1}`;
        args.push(values[field]);
    });

    return { query, args };
};

/**
 * Override PgPool.query() for catching SQL errors
 * @param args
 * @returns {Promise<*>}
 */
const oldPoolQuery = pool.query;
pool.query = async (...args) => {
    try {
        return await oldPoolQuery.apply(pool, args)
    } catch (err) {
        console.error('SQL QUERY ERROR:', ...args);
        throw err;
    }
};

pool.queryWithLog = async (...args) => {
    try {
        console.log('SQL QUERY:', ...args);
        return await oldPoolQuery.apply(pool, args)
    } catch (err) {
        console.error('SQL QUERY ERROR:', ...args);
        throw err;
    }
};

module.exports = pool;
