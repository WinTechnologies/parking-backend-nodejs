const DBConfig = require('../../../config/postgres');

const createOptions = {
    host: DBConfig.PGHOST,
    user: DBConfig.PGUSER,
    database: DBConfig.PGDATABASE,
    password: DBConfig.PGPASSWORD,
    port: DBConfig.PGPORT,
    poolSize: 5, // or max: 5

    schema: DBConfig.PGBOSS_SCHEMA,
    // newJobCheckInterval: 500,// in milliseconds
    newJobCheckIntervalSeconds: 5, // in seconds
    // expireCheckInterval: 500, // in milliseconds
    // expireCheckIntervalSeconds:5, // in seconds
    expireCheckIntervalMinutes: 5, // in minutes
    // archiveCheckInterval: 500, // in milliseconds
    // archiveCheckIntervalSeconds:5, // in seconds
    archiveCheckIntervalMinutes: 60, // in minutes
    deleteCheckInterval: 500, // in milliseconds

    archiveCompletedJobsEvery: '2 days',
    deleteArchivedJobsEvery: '2 months',
};
exports.createOptions = createOptions;


/**
 * Return publish option
 * @param singletonKey?: string
 * @returns {{singletonKey?: string, retryDelay: number,
 *  expireInHours: number, retryBackoff: boolean, retryLimit: number}}
 */
exports.createPublishOption = (singletonKey) => {
    return {
        singletonKey: singletonKey,
        retryLimit: 20,
        retryDelay: 300, // in seconds
        retryBackoff: true,
        expireInHours: 2400,
    };
};
