const PgBoss = require('pg-boss');
const queueConfig = require('./config');
const OSESLogger = require('../../../helpers/mawgifLogger');

// console.log(PgBoss.getConstructionPlans('pgboss'));
// console.log(PgBoss.getMigrationPlans('pgboss', '1.0.0', true));
// console.log(PgBoss.getConstructionPlans('pgboss'))
// console.log('----')
// console.log(PgBoss.getMigrationPlans('pgboss', 11))
// console.log('----')
// console.log(PgBoss.getRollbackPlans('pgboss', 12))

let pgQueue;

const createQueue = async () => {
    try {
        const boss = new PgBoss(queueConfig.createOptions);
        boss.on('error', error => console.error(error));
        await boss.start();

        OSESLogger('info', {
            subject: 'PgBoss Started!',
            message: '',
        });
        return boss;
    } catch (err) {
        OSESLogger('error', {
            subject: 'PgBoss Start Error',
            message: err.message,
        });
    }
};

const getPgQueueInstance = async () => {
    if (!pgQueue) {
        pgQueue = await createQueue();
    }
    return pgQueue;
};
exports.getPgQueueInstance = getPgQueueInstance;
