const { getPgQueueInstance } = require('../services/pgboss/queue');
const QueueConfig = require('../services/pgboss/config');
const { QueueName, SubjectName } = require('../services/pgboss/constants');

const cnModel = require('../contravention/model');
const jobModel = require('../jobs/job.model');
const cashierTicketModel = require('../pg/cashier-ticket/cashier-ticket.model');
const cnService = require('../contravention/service');
const OSESController = require('./../../api/mawgif/controller');
const cashierMiddleware = require('./../../api/mawgif/cashier-payment.middleware');
const OSESLogger = require('../../helpers/mawgifLogger');

/**
 * @param cn
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<*>}
 */
const createOSESVRM = async (cn, req = null) => {
    try{
        const mawgifVrm = await OSESController.createMawgifVRM(cn, req);

        if (mawgifVrm && mawgifVrm.data && mawgifVrm.data.length > 0 && mawgifVrm.error_code === '0') {
            OSESLogger('info', { subject: 'CreateVRM-result', message: mawgifVrm }, req);
            return mawgifVrm.data[0].Vrm_Cd;
        } else {
            OSESLogger('error', { subject: 'CreateVRM-result', message: mawgifVrm }, req);
            return null;
        }
    } catch (err) {
        OSESLogger('error', { subject: 'CreateVRM-error', message: err.message }, req);
        return null;
        // Don't throw error because even if createVRM failure we should be able to create MAPS Job
        // throw new Error('Create OSES VRMCode Error');
    }
};

/**
 * @param cn
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<*>}
 */
const updateOSESVRM = async (cn, req = null) => {
    try {
        const resultVRM = await OSESController.updateMawgifVRM(cn, req);

        if (resultVRM && resultVRM.data && resultVRM.data.length > 0 && resultVRM.error_code === '0') {
            OSESLogger('info', { subject: 'UpdateVRM-result', message: resultVRM }, req);
            return resultVRM.data[0].Vrm_Cd;
        } else {
            OSESLogger('error', { subject: 'UpdateVRM-result', message: resultVRM }, req);
        }
    } catch (err) {
        OSESLogger('error', { subject: 'UpdateVRM-error', message: err.message }, req);
        // Don't throw error because even if updateVRM failure we should be able to create OSES Ticket and OSES Job
        // throw new Error(`Update OSES VRMCode Error`);
    }
};

/**
 * @param cn
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<*>}
 */
const createOSESTicket = async (cn, req = null) => {
    try {
        const resultTicket = await OSESController.createMawgifTicket(cn, req);

        if (resultTicket && resultTicket.data && resultTicket.data.length > 0 && resultTicket.error_code === '0') {
            OSESLogger('info', { subject: 'CreateTicket-result', message: resultTicket }, req);
            await updateOSESVRM(cn);
            return true;
        } else {
            OSESLogger('error', { subject: 'CreateTicket-result', message: resultTicket }, req);
            return false;
        }
    } catch (err) {
        OSESLogger('error', { subject: 'CreateTicket-error', message: err.message }, req);
        return false;
        // throw new Error('Create OSES Ticket Error');
    }
};

/**
 * @param cn
 * @param job
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<*>}
 */
const createOSESJob = async (cn, job, req = null) => {
    try {
        const mawgifJob = await OSESController.createMawgifJob(job, req);

        if (mawgifJob && mawgifJob.data && mawgifJob.data.length > 0 && mawgifJob.error_code === '0') {
            OSESLogger('info', { subject: 'CreateOSESJob-result', message: mawgifJob }, req);
            await updateOSESVRM(cn);
            return true;
        } else {
            OSESLogger('error', { subject: 'CreateOSESJob-result', message: mawgifJob }, req);
            return false;
        }
    } catch (err) {
        OSESLogger('error', { subject: 'CreateOSESJob-error', message: err.message }, req);
        // throw new Error(`Create OSES Job Error`);
        return false;
    }
};


/**
 *
 * @param option <{vrmRecall: boolean, ticketRecall: boolean, jobRecall: boolean}>
 * @param cn
 * @param job
 * @returns {Promise<{
 *  vrmCode: string (optional),
 *  vrmRecall_Success: boolean (optional),
 *  ticketRecall_Success: boolean (optional),
 *  jobRecall_Success: boolean (optional)
 * }>}
 */
const createOSES_VRM_Job_Ticket = async (option, cn, job = null) => {
    let result = {};

    /* Step1: create OSES VRMCode */
    if (option.vrmRecall) {
        const vrmCode = await createOSESVRM(cn);
        if (vrmCode) {
            cn['reference'] = vrmCode;
            result['vrmCode'] = vrmCode;
            result['vrmRecall_Success'] = true;
        }
    }

    /* Step2: create OSES Ticket -> ticket.amount = cn.amount */
    if (option.ticketRecall) {
        if (!cn.reference) {
            OSESLogger('error', { subject: 'CreateTicket-error', message: 'Cannot create without VRM Code' });
        } else {
            result['ticketRecall_Success'] = await createOSESTicket(cn);
        }
    }

    /* Step3: create OSES Job */
    if (option.jobRecall && job) {
        if (!cn.reference) {
            OSESLogger('error', {subject: 'CreateOSESJob-error', message: 'No OSES Job required'});
        } else {
            result['jobRecall_Success'] = await createOSESJob(cn, job);
        }
    }
    return result;
};

/**
 * Schedule OSES APIs for a new MAPS CN
 * @param cn_number_offline <string>
 * @param option <{vrm:boolean, ticket:boolean, job: boolean}>
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<string>}
 */
const scheduleCNRecalls = async (cn_number_offline, option, req = null) => {
    try {
        const pgQueue = await getPgQueueInstance();
        const jobData = {
            subject: SubjectName.RECALL_OSES_CN,
            cn_number_offline,
            option,
        };

        const pubOption = QueueConfig.createPublishOption(cn_number_offline);

        const jobId = await pgQueue.publish(QueueName.RECALL_OSES_CN, jobData, pubOption);
        if (jobId) {
            OSESLogger('info', {
                subject: 'Publish a recall OSES-CN',
                message: `CN #${cn_number_offline}: ${JSON.stringify(option)}`
            }, req);
        } else {
            // There is an active job that has the same singleton-key, or Throttling
        }
        return jobId;
    } catch (err) {
        OSESLogger('error', {
            subject: 'Publish a recall OSES-CN Error',
            message:  `CN #${cn_number_offline}: ${err.message}`,
        }, req);
        // Don't throw error
    }
};

/**
 * @param option <{vrmRecall: boolean, ticketRecall: boolean, jobRecall: boolean}>
 * @param subject
 * @param cn_number_offline
 * @returns {Promise<{
 *  vrmCode: string (optional),
 *  vrmRecall_Success: boolean (optional),
 *  ticketRecall_Success: boolean (optional),
 *  jobRecall_Success: boolean (optional)
 * }>}
 */
const callOSESAPIs = async (subject, cn_number_offline, option) => {
    const CNs = await cnModel.getByIdPg(cn_number_offline);
    if (!CNs || CNs.rowCount === 0) {
        throw new Error('cn_number_offline doesn\'t exist');
    }
    const cn = CNs.rows[0];

    let job = null;
    const jobs = await jobModel.getJobByCnNumberOffline(cn_number_offline);
    if (jobs && jobs.rowCount > 0) {
        job = jobs.rows[0];
    }

    const { project_name, project_gmt, vat_id, violation_code, zone_name } =
        await cnService.prepareCNData(cn.project_id, cn.violation_id, cn.zone_id);
    cn['project_name'] = project_name;
    cn['project_gmt'] = project_gmt;
    cn['vat_id'] = vat_id;
    cn['violation_code'] = violation_code;
    cn['zone_name'] = zone_name;
    if (job !== null) {
        job['project_name'] = project_name;
        job['project_gmt'] = project_gmt;
        job['vat_id'] = vat_id;
        job['violation_code'] = violation_code;
        job['zone_name'] = zone_name;
    }

    // { vrmCode, vrmRecall_Success, ticketRecall_Success, jobRecall_Success }
    const result = await createOSES_VRM_Job_Ticket(option, cn, job);

    if (result.vrmCode && result.vrmRecall_Success) {
        await cnModel.updatePg({
            cn_number_offline: cn_number_offline,
            reference: result.vrmCode,
        });
    }

    return result;
};

/**
 * Call OSES payment API
 * @param ticket_number
 * @param paymentDetails
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<{paymentRecall_Success: boolean}>}
 */
const createOSES_Payment = async (ticket_number, paymentDetails, req = null) => {
    const response = await OSESController.createMawgifPayment(paymentDetails);

    try {
        await cashierTicketModel.updateTicket(ticket_number, {
            reference: response.data,
        });
        OSESLogger('info', {
            subject: 'Update Cashier_Ticket',
            message: `Reference ${response.data} in Ticket ${ticket_number}`
        }, req);
    } catch (err) {
        OSESLogger('error', {
            subject: 'Update Cashier_Ticket Error',
            message: `${err.message} during update of Reference in Ticket ${ticket_number}`
        }, req);
    }
};

const recallCNHandler = async (job) => {
    const { subject, cn_number_offline, option } = job.data;
    const pgQueue = await getPgQueueInstance();

    try {
        OSESLogger('info', {
            subject: 'Consume a recall OSES-CN',
            message: `CN #${cn_number_offline}`
        });
        const result = await callOSESAPIs(subject, cn_number_offline, option);
        await pgQueue.complete(job.id, result);
    } catch (err) {
        if (err.message === 'cn_number_offline doesn\'t exist') {
            await pgQueue.cancel(job.id);
        } else {
            await pgQueue.fail(job.id, err);
        }
        OSESLogger('error', {
            subject: 'Consume a recall OSES-CN Error',
            message: `CN #${cn_number_offline}: ${err.message}`
        });
    }
};

const recallPaymentHandler = async (job) => {
    const { ticket_number, paymentDetails } = job.data;
    const pgQueue = await getPgQueueInstance();

    try {
        OSESLogger('info', {
            subject: 'Consume a recall OSES-Payment',
            message: `Ticket #${ticket_number}`
        });
        const paymentRef = await createOSES_Payment(ticket_number, paymentDetails);
        await pgQueue.complete(job.id, paymentRef);
    } catch (err) {
        await pgQueue.fail(job.id, err);
        OSESLogger('error', {
            subject: 'Consume a recall OSES-Payment Error',
            message: `Ticket #${ticket_number}: ${err.message}`
        });
    }
};


exports.createOSESVRM = createOSESVRM;
exports.scheduleCNRecalls = scheduleCNRecalls;
// exports.schedulePaymentRecalls = schedulePaymentRecalls; Currently scheduled in Operation
exports.recallCNHandler = recallCNHandler;
exports.recallPaymentHandler = recallPaymentHandler;
