const cnModel = require('./model');
const cashierTicketModel = require('../pg/cashier-ticket/cashier-ticket.model');
const violationModel = require('../pg/violation/violation.model');
const projectModel = require('../pg/projects/projects.model');
const vatModel = require('../pg/vat/vat.model');
const zoneModel = require('../pg/project_zone/project_zone.model');

const OSESLogger = require('../../helpers/mawgifLogger');
const punycode = require('punycode');

/**
 * When car_plate number coming from mobile, special characters would be
 *  included in the string. 11111###A###A###A
 *  Those characters(#) should be removed
 *      - before inserting the plate number inserted into db
 *      - or search db records with it.
 *
 * car_plate unicode string ==> single code points, matching UTF-16
 *  => [0x61, 0x62, 0x63]
 * https://github.com/bestiejs/punycode.js#punycodeucs2decodestring
 *
 * And remove unicode spaces(\u200c) which is used in mobile apps
 * then create new string
 */
exports.removeSpecialCharsInPlate = (car_plate) => {
    let codePoints = punycode.ucs2.decode(car_plate);
    codePoints = codePoints.filter(p => p !== 8204);  // \u200c

    // clean plate number
    return String.fromCodePoint(...codePoints);
};

/**
 * Create or update tickets in cashierExit and cashierTicket models
 * @param data <{ car_plate, plate_type, plate_country, project_id, vat_id, creator_id }>
 * @param cnOfflineNumber - related cn_number_offline: only when a cn is created
 * @param jobNumber - related job_number: only when a job is created
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 */
exports.createTickets = async (data, cnOfflineNumber, jobNumber, req = null) => {
    const existingTickets = await cashierTicketModel
        .getUnpaidTicket({
            car_plate: data.car_plate,
            car_type : data.plate_type,
            project_id: data.project_id,
        });

    if (existingTickets == null || existingTickets.rowCount < 1) {
        const related_cn = cnOfflineNumber? [cnOfflineNumber] : [];
        const related_job = jobNumber? [jobNumber] : [];

        // No ticket for this car in this project so create one --- CN Ticket
        const ticketNumber = `T${Date.now()}`;
        const [createExitResult, createTicketResult] = await Promise.all([
            cashierTicketModel.createExit({
                ticket_number : ticketNumber,
                car_plate : data.car_plate,
                car_country : data.plate_country,
                car_type : data.plate_type,
                project_id : data.project_id,
                vat_id: data.vat_id,
                cn_related: related_cn,
                job_related : related_job,
                operation_type : 'Enforcement',
                issued_by : data.creator_id,
                issued_at : new Date(),
            }),
            cashierTicketModel.createTicket({
                ticket_number : ticketNumber,
                is_paid : false,
                issued_at : new Date(),
            }),
        ]);

        let exit = {};
        if (!createExitResult.rowCount) {
            OSESLogger('error', {
                subject: 'Create Cashier_Exit Error',
                message: 'No Cashier Exit created'
            }, req);
        } else {
            exit = createExitResult.rows[0];
            OSESLogger('info', {
                subject: 'Create Cashier_Exit',
                message: `${exit.ticket_number} from CN ${exit.cn_related}, Job ${exit.job_related}`
            }, req);
        }

        if (!createTicketResult.rowCount) {
            OSESLogger('error', {
                subject: 'Create Cashier_Ticket Error',
                message: 'No Cashier Ticket created'
            }, req);
        } else {
            const ticket = createTicketResult.rows[0];
            OSESLogger('info', {
                subject: 'Create Cashier_Ticket',
                message: `${ticket.ticket_number} from CN ${exit.cn_related}, Job ${exit.job_related}`
            }, req);
        }

    } else {
        // A ticket already exist so add the cn_offline_number & job_number
        const ticket = existingTickets.rows[0];

        if (cnOfflineNumber) {
            ticket.cn_related.push(cnOfflineNumber);
            ticket.cn_related = [...new Set(ticket.cn_related)];
        }

        // If a job has been created due to this CN
        if (jobNumber) {
            ticket.job_related.push(jobNumber);
            ticket.job_related = [...new Set(ticket.job_related)];
        }

        const updateExitResult = await cashierTicketModel.updateExit(ticket.ticket_number, {
            cn_related: `{${ticket.cn_related}}`,
            job_related: `{${ticket.job_related}}`
        });

        if (!updateExitResult.rowCount) {
            OSESLogger('error', {
                subject: 'Update Cashier_Exit Error',
                message: 'No Cashier Ticket updated'
            }, req);
        } else {
            const exit = updateExitResult.rows[0];
            OSESLogger('info', {
                subject: 'Update Cashier_Exit',
                message: `${exit.ticket_number} from CN ${exit.cn_related}, Job ${exit.job_related}`
            }, req);
        }
    }
};

exports.prepareCNData = async (project_id, violation_id, zone_id) => {
    let project_name = null,  project_gmt = 0, vat_id = null, violation_code = null, zone_name = null;

    const [project, vat, violation, zone] = await Promise.all([
        projectModel.getProjectById(project_id),
        vatModel.getOneByProject(project_id),
        violationModel.get({id: violation_id}),
        zoneModel.getAll({id: zone_id}),
    ]);

    if (project && project.rowCount > 0) {
        project_name = project.rows[0].project_name;
        if (project.rows[0].gmt && typeof project.rows[0].gmt === 'string') {
            // project.gmt: 'UTC+03:00'
            project_gmt = parseInt(project.rows[0].gmt.substr(4, 2));
        } else {
            project_gmt = 0;
        }
    }

    if (vat && vat.rowCount > 0) {
        vat_id = vat.rows[0].id;
    }
    if (violation && violation.rowCount > 0) {
        violation_code = violation.rows[0].violation_code;
    }
    if (zone && zone.rowCount > 0) {
        zone_name = zone.rows[0].zone_name;
    }

    return { project_name, project_gmt, vat_id, violation_code, zone_name };
};

const sqCNModel = require('./../pg/sequelize-models').contravention;
const { CNStatus, CNNote, SystemUser } = require('../contravention/constants');
const cargo = require('async/cargo');
const AutoCancellationPayload = 5;

/**
 * Returns Async Cargo Object for bulk update of CN data
 * @param BulkHandlePayload
 * @returns {*}
 */
const createBulkHandler = (BulkHandlePayload) => {
    /**
     * Observations <[{
     *    cn_number_offline, notes,
     *    canceled_by, canceled_at, status
     * }]>
     */
    return cargo(async (obs, callback) => {
        try {
            // Note: postgres does not support the 'updateOnDuplicate' option.
            // await sqCNModel.bulkCreate(obs, { updateOnDuplicate: ['cn_number_offline']});

            await Promise.all(obs.map(ob => {
                const whereParams = { cn_number_offline: ob.cn_number_offline };
                const updateBody = {
                    notes: ob.notes,
                    canceled_by: ob.canceled_by,
                    canceled_at: ob.canceled_at,
                    status: ob.status,
                };
                return cnModel.updateContravention(whereParams, updateBody, SystemUser);
            }));
            if (callback) callback();

            OSESLogger('info', {
                subject: 'Auto-Obs-Cancellation',
                message: `Canceled ${obs.length} outstanding observations: [${obs.map(ob => ob.cn_number_offline)}]`
            });

        } catch(err) {
            OSESLogger('error', {
                subject: 'Auto-Obs-Cancellation',
                message: `Obs [${obs.map(ob => ob.cn_number_offline)}]: ${err.message}`
            });
        }
    }, BulkHandlePayload);
};

const cancelObsHandler = createBulkHandler(AutoCancellationPayload);

exports.handleExpiredObs = async () => {
    try {
        const observations = (await cnModel.getExpiredObs(AutoCancellationPayload)).rows;
        if (!observations || !observations.length) {
            return;
        }

        OSESLogger('info', {
            subject: 'Auto-Obs-Cancellation',
            message: `Found ${observations.length} outstanding observations: [${observations.map(obs => obs.cn_number_offline)}]`
        });

        const updatePromises = observations
            .map(obs => {
                return cancelObsHandler.push({
                    cn_number_offline: obs.cn_number_offline,
                    notes: CNNote.ExpiredObs,
                    canceled_by: SystemUser,
                    canceled_at: new Date(),
                    status: CNStatus.CancelObs,
                });
            });
        await Promise.all(updatePromises);
    } catch (err) {
        OSESLogger('error', { subject: 'Auto-Obs-Cancellation', message: err.message });
    }
};
