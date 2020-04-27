const cnMiddleware = require("./middleware");
const cnModel = require("./model");
const cnService = require('./service');
const OSESService = require('../mawgif/service');
const { MqttSubject, CNStatus, CNNote, ViolationDecision } = require('./constants');

const escalationModel = require('../../models/escalation');
const vehicleModel = require('../pg/vehicle/vehicle.model');

const OSESLogger = require('../../helpers/mawgifLogger');
const MQTTpublisher = require('../services/MQTT/publisher');

const punycode = require('punycode');
const moment = require('moment');

/**
 * Create Contraventions by requests from MAPS mobile app, OSES system
 *  Sent by Maps   car_plate: English Plate, car_plate_ar: Arabic Plate
 *  Sent by OSES   car_plate: -            , car_plate_ar: Arabic Plate
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.create = async (req, res, next) => {
    try {
        // TODO: logger with new middleware
        OSESLogger('info', {
            subject: 'Create MAPS CN: Request Body',
            message: JSON.stringify(req.body),
        }, req);

        const currentUser = req._user.employee_id;
        const requiredFields = cnMiddleware.checkMissingRequiredFields(req.body);
        if (requiredFields.length > 0) {
            const responseMsg = `Missing Required Parameters: ${requiredFields}`;
            OSESLogger('error', { subject: 'Create MAPS CN', message: responseMsg }, req);
            return res.status(400).json({ message: responseMsg });
        }

        let { missedOptionalFields, nanFields, castedData: cn } = cnMiddleware.checkMissingOptionalFields(req.body);
        if (nanFields.length > 0) {
            const responseMsg = `Invalid Numeric Parameters: ${nanFields}`;
            OSESLogger('error', { subject: 'Create MAPS CN', message: responseMsg }, req);
            return res.status(400).json({ message: responseMsg, missedOptionalFields });
        }

        cn.car_plate = cnService.removeSpecialCharsInPlate(cn.car_plate);
        if (!isEnglishLetter(cn.car_plate)) { // sent by OSES
            cn['car_plate_ar'] = cn.car_plate;
            cn.car_plate = getCarPlateTranslation(cn.car_plate_ar, false);
        }

        const existingCn = await cnModel.getByIdPg(cn.cn_number_offline);
        if (existingCn && existingCn.rowCount > 0) {
            const responseMsg = 'Another contravention exists with the same cn_number_offline';
            OSESLogger('error', { subject: 'Create MAPS CN', message: responseMsg }, req);
            return res.status(400).json({
                reason: 'duplicate',
                message: responseMsg,
                missedOptionalFields,
            });
        }

        if (!cn.amount) {
            const responseMsg = 'Amount cannot be zero';
            OSESLogger('error', { subject: 'Create MAPS CN', message: responseMsg }, req);
            return res.status(400).json({
                reason: 'no_amount',
                message: responseMsg,
                missedOptionalFields,
            });
        }

        // const existingJob = await jobModel.checkIfAJobIsAvailable(cn);
        // if (existingJob && existingJob.rowCount > 0) {
        //     return res.status(400).json({reason: 'duplicate', message: 'A job with this carplate is in progress'});
        // }

        const currentDate = (new Date()).toISOString();
        cn['review_status'] = 'Unreviewed';
        cn['creation'] = !cn['creation'] ? currentDate : cn['creation'];
        cn['sent_at'] = !cn['sent_at'] ? currentDate : cn['sent_at'];
        cn['sent_by'] = !cn['sent_by'] ? 'OSES' : cn['sent_by']; // sent_by: MAPS | OSES

        if (parseInt(cn.status) === parseInt(CNStatus.EvolvedCN)) {
            cn['status'] = CNStatus.CN;
            cn['notes'] = CNNote.EvolvedCN;
        } else {
            cn['evolved_into_cn_at'] = null;
        }

        // TODO: create prepareCNData() and re-use the function in createCN(), transformObs(), RecallOSES()
        //  1. for following columns unavailable in CN table
        //          violation_code, project_name, project_gmt, vat_id, zone_name
        //  2. for init review_status, car_pictures, creation, sent_by

        const { project_name, project_gmt, vat_id, violation_code, zone_name } =
            await cnService.prepareCNData(cn.project_id, cn.violation_id, cn.zone_id);

        cn['project_name'] = project_name;
        cn['project_gmt'] = project_gmt;
        cn['vat_id'] = vat_id;
        cn['violation_code'] = violation_code;
        cn['zone_name'] = zone_name;

        // Check existing observations
        // const existingObs = await cnModel.getContraventions({cn_number: cn.cn_number});
        // if (existingObs !== null && existingObs.rowCount > 0) {
        //     cn['status'] = CNStatus.Obs;
        //     cn['reference'] = existingObs.rows[0].reference;
        // }

        const duplicatedCNs = await checkDuplicatedCNs(cn);
        if (duplicatedCNs.length > 0) {
            cn['status'] = CNStatus.DupCN;
            // The oldest CN among the duplicated CNs would be reference of current CN!
            cn['notes'] = CNNote.DuplicatedCN(duplicatedCNs[0]['cn_number_offline']);
        }

        const createdCNs = await cnModel.createCN(cn);
        if (!createdCNs || createdCNs.rowCount === 0) {
            const responseMsg = 'Error during CN creation!';
            OSESLogger('error', { subject: 'Create MAPS CN', message: responseMsg }, req);
            return res.status(500).json({ message: responseMsg, missedOptionalFields });
        }

        const createdCN = createdCNs.rows[0];
        cn['cn_number'] = createdCN.cn_number;
        OSESLogger('info', {
            subject: createdCN.status === CNStatus.Obs ? 'Create MAPS CN(Observation)' : 'Create MAPS CN',
            message: `${createdCN.cn_number}-${createdCN.cn_number_offline} sent by ${createdCN.sent_by}`
        }, req);

        let newVRMCode = null;
        if (cn.sent_by === 'MAPS') { // !cn.reference && cn.status !== CNStatus.DupCN
            newVRMCode = await OSESService.createOSESVRM(cn, req);
            cn['reference'] = newVRMCode;
            await cnModel.updatePg({
                cn_number_offline: cn.cn_number_offline,
                reference: cn.reference,
            });
        }

        const promises = [
            createJob(cn, 'NormalCN', currentUser, req),
            vehicleModel.increaseBrandClick(cn.car_brand),
            vehicleModel.increaseModelClick(cn.car_model),
        ];
        const [jobResult, ...increaseClicks] = await Promise.all(promises);
        const { newJobNumber } = jobResult;

        if (cn.sent_by === 'MAPS') {  // cn.status !== CNStatus.DupCN
            const recallOption = {};
            if (!newVRMCode) {
                recallOption['vrmRecall'] = true;
            }
            if (cn.status === CNStatus.CN) {
                recallOption['ticketRecall'] = true;
            }
            if (cn.status === CNStatus.CN && newJobNumber) {
                recallOption['jobRecall'] = true;
            }

            if (Object.keys(recallOption).length > 0) {
                await OSESService.scheduleCNRecalls(cn.cn_number_offline, recallOption, req);
            }
        }

        if (cn.status === CNStatus.CN) {
            // TODO: handle tickets for unpaid CNs from logicByEscalation
            await cnService.createTickets(cn, cn.cn_number_offline, newJobNumber, req);
        }

        const result = {...cn, vrm_code: newVRMCode};
        MQTTpublisher.client.publish(MqttSubject.CreatedCN, JSON.stringify(createdCN));

        return res.status(201)
            .json({
                message: 'Created.',
                status: cn.status,
                content: result,
                missedOptionalFields,
            });

    } catch (err) {
        // ignore err.message === 'Create OSES VRMCode Error'
        // from escalationModel.createOSESVRM in handleRelatedCN()
        OSESLogger('error', { subject: 'Create CN ERROR', message: err.message }, req);
        next(err);
    }
};

/**
 * Return duplicated CNs by ascending order of creation date
 *      For new CN's status coming from mobile (0, 1) we will exclude status column in search criteria.
 *      CN's status can be changed to 2, 4 or 5 in BE.
 *
 *      1. CNs with status 2, 4  will be excluded from search result because they are already cancelled
 *      2. If any CN with status 0, 1, 5 and same details in the day exists, new CN will be marked as Duplicated
 * @param cn: Contravention Object
 * @returns {Promise<*>}
 */
const checkDuplicatedCNs = async (cn) => {
    const similarCNs = await cnModel.getContraventions({
        car_plate: cn['car_plate'],
        plate_country: cn['plate_country'],
        plate_type: cn['plate_type'],
        violation_id: cn['violation_id'],
        street_name_en: cn['street_name_en'],
        intersection_name_en: cn['intersection_name_en'],
        // address_simplified: cn['address_simplified'],
    });

    // YYYYMMDD from cn_number_offline
    const ymdCN = cn['cn_number_offline'].substr(0, 6);
    const refCN = cn['reference'];

    // duplicatedCNs
    return similarCNs.rows
        .filter(el => {
            // YYYYMMDD from cn_number_offline
            const ymd = el['cn_number_offline'].substr(0, 6);
            return ymdCN === ymd
                && ((refCN !== el.reference) || (!refCN && !el.reference))
                && el.status !== CNStatus.CancelCN
                && el.status !== CNStatus.CancelObs;
        })
        // Ascending Order by creation date - from oldest to newest!
        .sort((el1, el2) => el1.creation < el2.creation);
};

/**
 * For CNs from MAPS, Create MAPS Job, OSES VRM, OSES Ticket, OSES Job
 *  by ViolationAssignment or Escalation Rule
 * @param cn: CN Object with project_id, project_gmt, vat_id
 * @param type: NormalCN | TransformCN
 * @param currentUser: employee.employee_id
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<{newJobNumber: number | null}>}
 */
const createJob = async (cn, type, currentUser, req = null) => {
    /**
     *  escalationModel.logicByAssignment() returns vrmCode and jobNumber
     *
     *  violation_decision:
     *      ViolationDecision.Obs('Observation'),
     *      ViolationDecision.Ticket('Direct Ticket')   -> Tow or Clamp Job according to matched Escalation Rules
     *      ViolationDecision.Clamp('Direct Clamp')     -> (ViolationDecision.Ticket + directly Clamp Job)
     *      ViolationDecision.Tow('Direct TOW')         -> (ViolationDecision.Ticket + directly Tow Job)
     *  cn.status
     *      --------------- Statuses coming from mobile
     *      '0' - Observation --- violation_decision: 'Observation'
     *          Save Obs in MAPS
     *          Create VRM in OSES
     *          Update Obs with Reference of VRM
     *      '1' - CN:
     *          Violation Code 17: Parked/overstayed in a loading/unloading bay or space
     *              creates a Clamp Job,
     *              violation_decision: ViolationDecision.Clamp
     *          Violation Code 800: Parked within the road and traffic area
     *              creates a Tow Job,
     *              violation_decision: ViolationDecision.Tow
     *          Other codes creates no job
     *              violation_decision: ViolationDecision.Ticket
     *
     *      ---------------- Statuses that can be updated to in BE
     *      '2' - Cancelled Observation
     *      '4' - Cancelled Contravention
     *      '5' - Duplicated Contravention --- not generating any job, ticket
     *
     *      ---------------- Unused status
     *      '3' - Evolved into Contravention from Observation
     */

    let newJobNumber;

    if (cn['sent_by'] === 'MAPS') {
        if (type === 'NormalCN') {

            switch (cn['violation_decision']) {
                case ViolationDecision.Tow:
                case ViolationDecision.Clamp:
                    if (cn.status !== CNStatus.Obs && cn.status !== CNStatus.DupCN) {
                        const result1 = await escalationModel.logicByAssignment(cn, currentUser, req);
                        newJobNumber = result1.jobNumber;
                    }
                    break;

                case ViolationDecision.Ticket:
                    const result2 = await escalationModel.logicByEscalation(cn, req);
                    newJobNumber = result2.jobNumber;
                    break;

                default:
                    break;
            }

        } else if (type === 'TransformCN') {
            const result3 = await escalationModel.logicByEscalation(cn, req);
            newJobNumber = result3.jobNumber;
        }
    }

    return { newJobNumber };
};

exports.verify = async (req, res, next) => {
    try {
        let { missedOptionalFields, nanFields, castedData: cn } = cnMiddleware.checkMissingOptionalFields(req.body);
        if (nanFields.length > 0) {
            return res.status(400).json({
                message: `Invalid Numeric Parameters: ${nanFields}`,
                missedOptionalFields,
            });
        }

        // At first time when we receive car_plate from mobile side,
        // Should remove special chars 8204(u200C)
        cn.car_plate = cnService.removeSpecialCharsInPlate(cn.car_plate);
        if (!isEnglishLetter(cn.car_plate)) {
            cn.car_plate = getCarPlateTranslation(cn.car_plate, false);
        }

        // Check duplicated CNs before creating JOB/CN
        const duplicatedCNs = await checkDuplicatedCNs(cn);
        if (duplicatedCNs.length > 0) {
            return res.status(400).json({
                reason: 'duplicate',
                message: 'Duplicate CN (more than one CN of the same violation type can\'t be issued for the same vehicle)'
            });
        } else {
            return res.status(200).json({ message: 'verified' });
        }
    } catch (err) {
        OSESLogger('error', { subject: 'Verify CN ERROR', message: err.message }, req);
        next(err);
    }
};

// TODO: check if we actually use this endpoint/controller
exports.get = async (req, res, next) => {
    const startDate = req.query.startDate;
    delete req.query.startDate;
    const endDate = req.query.endDate;
    delete req.query.endDate;

    try {
        const response = await cnModel.getContraventions(req.query);
    } catch (e) {
        return next(e);
    }

    if (startDate && endDate) {
        response.rows = response.rows.filter(contravention => {
            if (!moment(contravention.creation, moment.ISO_8601).isValid())
                return false;
            return (
                contravention.creation &&
                moment(startDate).isBefore(contravention.creation) &&
                moment(endDate).isAfter(contravention.creation)
            );
        });
    }

    return res.status(200).json(response.rows);
};

exports.observationsHistory = async (req, res, next) => {
    try {
        req.body['creator_id'] = req._user.employee_id;
        const result = await cnModel.observationsHistoryPg(req.body);
        return res.status(200).json({ rows: result.rows });
    } catch (err) {
        OSESLogger('error', { subject: 'GET Obs By Creator ERROR', message: err.message }, req);
        next(err);
    }
};

exports.cnHistory = async (req, res, next) => {
    try {
        req.body['creator_id'] = req._user.employee_id;
        const result = await cnModel.getContraventionsByCreatorAndStatus(req.body);
        return res.status(200).json({ rows: result.rows });
    } catch (err) {
        OSESLogger('error', { subject: 'GET CN By Creator & Status ERROR', message: err.message }, req);
        next(err);
    }
};

exports.getContraventionsByUser = async (req, res, next) => {
    try {
        req.body['creator_id'] = req._user.employee_id;
        const result = await cnModel.getContraventionsByUser(req.body);
        return res.status(200).json({ rows: result.rows });
    } catch (err) {
        OSESLogger('error', { subject: 'GET CN By Creator ERROR', message: err.message }, req);
        next(err);
    }
};

// Description: Delete remote observation
exports.cancelObservation = async (req, res, next) => {
    try{
        const cn_number_offline = req.params.cnNumberOffline;
        const result = await cnModel.cancelObservationPg(cn_number_offline, req._user.employee_id);
        MQTTpublisher.client.publish(MqttSubject.CanceledCN, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Observation is canceled.' });
    } catch (err) {
        OSESLogger('error', { subject: 'Cancel Obs ERROR', message: err.message }, req);
        next(err);
    }
};

/**
 *
 * @param req { body: {violation_picture, evolved_into_cn_at}}
 * @param res
 * @param next
 * @returns {Promise<*>}
 * Description: Transform Observation to CN and update remote observation.
 */
exports.transformObservation = async (req, res, next) => {
    try {
        const currentUser = req._user.employee_id;
        const cn_number_offline = req.params.cnNumberOffline;
        let {violation_picture, evolved_into_cn_at} = req.body;

        const result1 = await cnModel.getByIdPg(cn_number_offline);
        if (!result1
            || result1.rowCount === 0
            || (result1.rowCount > 0 && result1.rows[0].status !== CNStatus.Obs)
        ) {
            return res.status(404).json({ message: 'Not found the observation' });
        }

        const existingObs = result1.rows[0];
        violation_picture = (existingObs.violation_picture || '')
            ? [violation_picture, existingObs.violation_picture].join(',')
            : violation_picture;

        const transformParams = {
            cn_number_offline,
            violation_picture,
            evolved_into_cn_at,
            employee_id: currentUser,
        };
        const result2 = await cnModel.transformObservation(transformParams);
        if (!result2 || result2.rowCount === 0) {
            return res.status(500).json({ message: 'Failed to transform Observation' });
        }

        const transformedCN = result2.rows[0];
        OSESLogger('info', {
            subject: 'Create MAPS CN(Transformed)',
            message: `${transformedCN.cn_number}-${transformedCN.cn_number_offline} sent by ${transformedCN.sent_by}`
        }, req);

        // TODO: create prepareCNData() and re-use the function in createCN(), transformObs(), RecallOSES()
        //  1. for following columns unavailable in CN table
        //          violation_code, project_name, project_gmt, vat_id, zone_name
        //  2. for init review_status, car_pictures, creation, sent_by
        const { project_name, project_gmt, vat_id, violation_code, zone_name } =
            await cnService.prepareCNData(transformedCN.project_id, transformedCN.violation_id, transformedCN.zone_id);
        transformedCN['project_name'] = project_name;
        transformedCN['project_gmt'] = project_gmt;
        transformedCN['vat_id'] = vat_id;
        transformedCN['violation_code'] = violation_code;
        transformedCN['zone_name'] = zone_name;

        const { newJobNumber } = await createJob(transformedCN, 'TransformCN', currentUser, req);

        if (transformedCN.sent_by === 'MAPS') { // transformedCN.status !== CNStatus.DupCN
            const recallOption = {};
            if (!transformedCN.reference) {
                recallOption['vrmRecall'] = true;
            }
            if (transformedCN.status === CNStatus.CN) {
                recallOption['ticketRecall'] = true;
            }
            if (transformedCN.status === CNStatus.CN && newJobNumber) {
                recallOption['jobRecall'] = true;
            }

            if (Object.keys(recallOption).length > 0) {
                await OSESService.scheduleCNRecalls(transformedCN.cn_number_offline, recallOption, req);
            }
        }

        // TODO: handle tickets for unpaid CNs from logicByEscalation
        await cnService.createTickets(transformedCN, transformedCN.cn_number_offline, newJobNumber, req);

        MQTTpublisher.client.publish(MqttSubject.UpdatedCN, JSON.stringify(transformedCN));
        return res.status(200).json({ message: 'transformed' });
    } catch (err) {
        OSESLogger('error', { subject: 'Transform Obs ERROR', message: err.message }, req);
        next(err);
    }
};

/**
 *
 * @param req
 *       {
 *           "carPlate": "‌ع‌ع‌ع6838",
 *           "plateType": "PRIVATE (WHITE)",
 *           "plateCountry": "Saudi Arab"
 *       }
 * @param res
 * @param next
 * Description: Check for existing car_plate in the remote
 * @returns {Promise<*>}
 */
exports.getContraventionByPlate = async (req, res, next) => {
    const  { carPlate, plateType, plateCountry } = req.params;

    // At first time when we receive car_plate from mobile side,
    // Should remove special chars 8204(u200C)
    let car_plate = cnService.removeSpecialCharsInPlate(carPlate);
    if (!isEnglishLetter(car_plate)) {
        car_plate = getCarPlateTranslation(car_plate, false);
    }

    try {
        const similarCNs = await cnModel.getContraventions({
            car_plate: car_plate,
            plate_country: plateCountry,
            plate_type: plateType,
        });
        return res.status(200).json({ rows: similarCNs.rows });
    } catch (err) {
        OSESLogger('error', { subject: 'CN By Plate ERROR', message: err.message }, req);
        next(err);
    }
};

exports.getContraventionByReference = async (req, res, next) => {
    try {
        if (req.params.reference) {
            const similarCNs = await cnModel.getContraventions({ reference: req.params.reference });
            return res.status(200).json(similarCNs.rows);
        } else {
            return res.status(400).json({ message: 'reference is missing' });
        }
    } catch (err) {
        OSESLogger('error', { subject: 'Get CN By Reference ERROR', message: err.message }, req);
        next(err);
    }
};

const isEnglishLetter = (car_plate) => {
    let isEnglish = false;
    let codePoints = punycode.ucs2.decode(car_plate);

    for (let i = 0; i < codePoints.length; i++) {
        if (65 <= codePoints[i] && codePoints[i] <= 90) {
            isEnglish = true;
            break;
        }
    }
    return isEnglish;
};

const translateArLetter =  (c) => {
    switch (c) {
        case 'A': return 'ا';
        case 'B': return 'ب';
        case 'J': return 'ح';
        case 'D': return 'د';
        case 'R': return 'ر';
        case 'S': return 'س';
        case 'X': return 'ص';
        case 'T': return 'ط';
        case 'E': return 'ع';
        case 'G': return 'ق';
        case 'K': return 'ك';
        case 'L': return 'ل';
        case 'Z': return 'م';
        case 'N': return 'ن';
        case 'H': return 'ه';
        case 'U': return 'و';
        case 'V': return 'ى';
    }
    return c;
};

const translateEnLetter =  (c) => {
    switch (c) {
        case 'ا': return 'A';
        case 'ب': return 'B';
        case 'ح': return 'J';
        case 'د': return 'D';
        case 'ر': return 'R';
        case 'س': return 'S';
        case 'ص': return 'X';
        case 'ط': return 'T';
        case 'ع': return 'E';
        case 'ق': return 'G';
        case 'ك': return 'K';
        case 'ل': return 'L';
        case 'م': return 'Z';
        case 'ن': return 'N';
        case 'ه': return 'H';
        case 'و': return 'U';
        case 'ى': return 'V';
    }
    return c;
};

/**
 * convert English Plates to Arabic Plates
 *  English Plate --> Arabic Plate: letters (reverse order) + numbers (normal order)
 *
 * @param lettersArr  [ "‌‌‌‌اود", ]
 * @param numbersArr ["8706",]
 * @returns {string}
 */
const translateToArPlates = (lettersArr, numbersArr) => {
    let translation = '';
    if (lettersArr && lettersArr.length) {
        lettersArr.forEach(letters => {
            for (let i = letters.length-1; i >=0 ; i--) {
                translation += translateArLetter(letters[i]) ;
            }
        });
    }

    if (numbersArr && numbersArr.length) {
        numbersArr.forEach(numbers => {
            for (let i = 0; i < numbers.length; i++) {
                translation += translateArLetter(numbers[i]);
            }
        });
    }
    return translation;
};

/**
 * convert Arabic Plates to English Plates
 *  English Plate: numbers (normal order) + letters (reverse order)
 *
 * @param lettersArr  [ "‌‌‌‌اود", ]
 * @param numbersArr ["8706",]
 * @returns {string}
 */
const translateToEnPlates = (lettersArr, numbersArr) => {
    let translation = '';
    if (numbersArr && numbersArr.length) {
        numbersArr.forEach(numbers => {
            for (let i = 0; i < numbers.length; i++) {
                translation += translateEnLetter(numbers[i]);
            }
        });
    }
    if (lettersArr && lettersArr.length) {
        lettersArr.forEach(letters => {
            for (let i = letters.length-1; i >=0 ; i--) {
                translation += translateEnLetter(letters[i]) ;
            }
        });
    }
    return translation;
};

const getCarPlateTranslation = (car_plate, isEnglish) => {
    let codePoints = punycode.ucs2.decode(car_plate);
    codePoints = codePoints.filter(p => p !== 8204);  // \u200c
    const plate = String.fromCodePoint(...codePoints).trim();

    const lettersArr = plate.match(/\D+/g);
    const numbersArr = plate.match(/\d+/g);

    return isEnglish
        ? translateToArPlates(lettersArr, numbersArr)
        : translateToEnPlates(lettersArr, numbersArr);
};

exports.getObservationsByCreatorID = async (req, res, next) => {
    try {
        const params = req.params;
        const result = await cnModel.getObservationsByCreatorID(params);
        if (result && result.rows) {
            return res.status(200)
                .json({ message: 'Success', content: result.rows });
        } else {
            return res.status(200)
                .json({
                    message: 'Success',
                    content:['No Observation available for this employee'],
                });
        }
    } catch(err) {
        OSESLogger('error', { subject: 'Get Obs By Creator ERROR', message: err.message }, req);
        next(err);
    }
};

exports.getContraventionByCnNumberOffline = async (req, res, next) => {
  try {
      const cn_number_offline = req.params.cn_number_offline;
      const response = await cnModel.getContraventionByCnNumberOffline(cn_number_offline);
      if (response.rows.length === 0) {
          return res.status(404).json({ message: 'Error', content: ['Could not find Contravention'] });
      }
      return res.status(200).json({message: 'Success', content: response.rows[0]});
  } catch (err) {
      OSESLogger('error', { subject: 'Get CN By Offline Number ERROR', message: err.message }, req);
      next(err);
  }
};

exports.updateByCNNumberOffline = async (req, res, next) => {
  try {
      const cnNumberOffline = req.params.cn_number_offline;
      const currentUser = req._user.employee_id;

      const response = await cnModel.getContraventionByCnNumberOffline(cnNumberOffline);
      if (response.rows.length === 0) {
          return res.status(404).json({ message:  "Error", content: ['Could not find Contravention'] });
      }
      const whereParams = { cn_number_offline: cnNumberOffline };
      await cnModel.updateContravention(whereParams, req.body, currentUser);
      return res.status(200).json({ message: 'Success', content: ['Contravention updated'] });
  } catch (err) {
      OSESLogger('error', { subject: 'Update CN By Plate ERROR', message: err.message }, req);
      next(err);
  }
};

exports.updateByReference = async (req, res, next) => {
  try {
    const currentUser = req._user.employee_id;
    const reference = req.params.reference;
    const status = req.params.status;

    const response = await cnModel.getContraventions({ reference: reference });

    if (response.rows.length === 0) {
        return res.status(404).json({ message:  'Error', content: ['Could not find Contravention'] });
    }

    const whereParams = { reference: reference, status: status };
    await cnModel.updateContravention(whereParams, req.body, currentUser);

    return res.status(200).json({ message: 'Success', content: ['Contravention updated'] });
  } catch (err) {
      OSESLogger('error', { subject: 'Update CN By Reference ERROR', message: err.message }, req);
      next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
        const params = req.query;
        let body = [];
        Object.keys(params).forEach((field, index, fields) => {
            if (params[field] !== '') {
                body[field] = params[field];
            }
        });
        const result = await cnModel.getAll(body);
        return res.status(200).json(result.rows);
  } catch (err) {
        OSESLogger('error', { subject: 'Get All CN ERROR', message: err.message }, req);
        next(err);
  }
};

exports.getStatusCodes = async (req, res, next) => {
  try {
      const result = await  cnModel.getStatusCodes();
      return res.status(200).json(result.rows);
  } catch (err) {
      OSESLogger('error', { subject: 'Get CN Status Codes ERROR', message: err.message }, req);
      next(err);
  }
};

exports.updateByCnNumber = async (req, res, next) => {
    try {
        const employee_id = req._user.employee_id;
        const whereParams = { cn_number: req.params.cn_number };
        const result = await cnModel.updateContravention(whereParams, req.body, employee_id);
        MQTTpublisher.client.publish(MqttSubject.UpdatedCN, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Success' });
    } catch (err) {
        OSESLogger('error', { subject: 'Update CN By CN Number ERROR', message: err.message }, req);
        next(err);
    }
};