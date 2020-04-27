const momentTimezone = require('moment-timezone');
const currentTimezoneOffset = momentTimezone().format('Z');

module.exports = {
    PGHOST: process.env.PGHOST,
    PGDATABASE: process.env.PGDATABASE,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGPORT: parseInt(process.env.PGPORT),
    PGBOSS_SCHEMA: process.env.PGBOSS_SCHEMA,
    CONFIG: {
        host: process.env.PGHOST,
        dialect: 'postgres',
        useUTC: true,
        timezone: currentTimezoneOffset,
        pool: {
            max: parseInt(process.env.PGMAXPOOL),
            min: parseInt(process.env.PGMINPOOL),
            idle: parseInt(process.env.PGIDLE),
        },
    }
};
