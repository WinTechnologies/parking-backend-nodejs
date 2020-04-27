const jobModel = require('./job.model');
const sqJobModel = require('./../pg/sequelize-models').job;
const OSESLogger = require('../../helpers/mawgifLogger');
const { JobStatus, SystemUser, CanceledCode, CanceledReason } = require('../contravention/constants');

const cargo = require('async/cargo');
const AutoCancellationPayload = 5;

/**
 * Returns Async Cargo Object for bulk update of Job data
 * @param BulkHandlePayload
 * @returns {*}
 */
const createBulkHandler = (BulkHandlePayload) => {
    /**
     * Jobs <[{
     *    job_number, cancel_reason, canceled_code
     *    canceled_by, canceled_at, status
     * }]>
     */
    return cargo(async (jobs, callback) => {
        try {
            // Note: postgres does not support the 'updateOnDuplicate' option.
            // await sqJobModel.bulkCreate(jobs, { updateOnDuplicate: ['job_number']});

            await Promise.all(jobs.map(job => jobModel.updateByJobNumber(job, job.canceled_by)));
            if (callback) callback();

            OSESLogger('info', {
                subject: 'Auto-Job-Cancellation',
                message: `Canceled ${jobs.length} TOW, CLAMP jobs: [${jobs.map(job => job.job_number)}]`
            });

        } catch(err) {
            OSESLogger('error', {
                subject: 'Auto-Job-Cancellation',
                message: `Jobs [${jobs.map(job => job.job_number)}]: ${err.message}`
            });
        }
    }, BulkHandlePayload);
};

const cancelJobHandler = createBulkHandler(AutoCancellationPayload);

/**
 * Cancel Tow, Clamp jobs that are created more than 24 hours ago,
 *  but not yet started
 * @returns {Promise<void>}
 */
exports.handleExpiredJobs = async () => {
    try {
        const jobs = (await jobModel.getExpiredOpenedJobs(AutoCancellationPayload)).rows;
        const targetJobs = jobs.filter(job => job.job_type === 'TOW JOB' || job.job_type === 'CLAMP JOB');

        if (!targetJobs || !targetJobs.length) {
            return;
        }

        OSESLogger('info', {
            subject: 'Auto-Job-Cancellation',
            message: `Found ${targetJobs.length} opened jobs: [${targetJobs.map(job => job.job_number)}]`
        });

        const updatePromises = targetJobs
            .map(job => {
                const canceledStatus = JobStatus.types[job.job_type].cancel;
                return cancelJobHandler.push({
                    job_number: job.job_number,
                    cancel_reason: CanceledReason.JOB,
                    canceled_code: job.job_type === 'TOW JOB'
                        ? CanceledCode.TOW
                        : CanceledCode.CLAMP,
                    canceled_by: SystemUser,
                    canceled_at: new Date(),
                    status: canceledStatus,
                });
            });
        await Promise.all(updatePromises);
    } catch (err) {
        OSESLogger('error', { subject: 'Auto-Job-Cancellation', message: err.message });
    }
};
