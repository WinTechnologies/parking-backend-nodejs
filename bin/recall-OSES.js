const schedule = require('node-schedule');
const { getPgQueueInstance } = require('../api/services/pgboss/queue');
const { QueueName } = require('../api/services/pgboss/constants');

const OSESService = require('../api/mawgif/service');
const jobService = require('../api/jobs/job.service');
const cnService = require('../api/contravention/service');
const OSESLogger = require('../helpers/mawgifLogger');

let pgQueue = null;
(async () => {
    try {
        pgQueue = await getPgQueueInstance();

        try {
            pgQueue.subscribe(QueueName.RECALL_OSES_CN, OSESService.recallCNHandler);
            pgQueue.subscribe(QueueName.RECALL_OSES_PAYMENT, OSESService.recallPaymentHandler);
        } catch (err) {
            OSESLogger('error', {
                subject: 'PgBoss Subscribe Error',
                message: err.message,
            });
        }

        try {
            // TODO: Regularly publish OSES VRM, Job, Ticket call for old CNs not having reference
            // setTimeout(() => {
            //     schedule.scheduleJob('*/10 * * * *', async () => {
            //         await OSESService.scheduleCNRecalls();
            //     });
            // }, 10000);

            setTimeout(() => {
                schedule.scheduleJob('* * * * *', async () => {
                    await jobService.handleExpiredJobs();
                });
            }, 20000);

            setTimeout(() => {
                schedule.scheduleJob('* * * * *', async () => {
                    await cnService.handleExpiredObs();
                });
            }, 30000);

        } catch (err) {
            OSESLogger('error', {
                subject: 'Auto-Obs/Job-Cancellation Start Error',
                message: err.message,
            });
        }

        // try {
        //     const batchSize = 1;
        //     const jobs = await pgQueue.fetch(QueueName.RECALL_OSES, batchSize);
        //     if(!jobs) {
        //         return
        //     }
        //     for (let i = 0; i < jobs.length; i++) {
        //         const job = jobs[i];
        //         try {
        //             await boss.complete(job.id);
        //         } catch(err) {
        //             await boss.fail(job.id, err);
        //         }
        //     }
        // } catch (err) {
        //     OSESLogger('error', {
        //         subject: 'PgBoss Fetch Error',
        //         message: err.message,
        //     });
        // }

    } catch (err) {
        handleExit({ exit: true, message: 'exit' });
    }
})();

// const assert = require('assert');
// await pgQueue.onComplete(QueueName.RECALL_OSES, onComplete);
// const onComplete = (job) => {
//     assert.equal(jobId, job.data.request.id);
//     assert.equal(job.data.request.data.token, requestPayload.token);
//     assert.equal(job.data.response.message, responsePayload.message);
//     assert.equal(job.data.response.code, responsePayload.code);
//     finished();
// };

const handleExit = (options, err) => {
    console.info(`${options.message} signal received.`);
    if (options.cleanup) {
        console.log('Closing all connections...');
        try {
            if (pgQueue) {
                pgQueue.stop();
                pgQueue = null;
            }
            setTimeout(() => process.exit(0), 3000);
        } catch (err) {
            return setTimeout(() => process.exit(1), 3000);
        }
    }

    if (options.exit) {
        if (err) console.error(err);
        process.exit(err ? 1 : 0);
    }
};

process.on('exit', handleExit.bind(null, { exit: true, message: 'exit' }));
process.on('SIGINT', handleExit.bind(null, { cleanup: true, message: 'SIGINT' }));
process.on('SIGTERM', handleExit.bind(null, { cleanup: true, message: 'SIGTERM' }));
process.on('uncaughtException', handleExit.bind(null, { cleanup: true, message: 'uncaughtException' }));
process.on('message', function(message) {
    // pm2 start app.js --shutdown-with-message
    // "shutdown_with_message" : true in ecosystem file
    console.info(`${message} signal received!!!`);
    switch (message) {
        case 'shutdown':
            handleExit({ cleanup: true, message });
            break;
    }
});





