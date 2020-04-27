const mawgifAPI = require('./api');
const cnService = require('./../contravention/service');
const moment = require('moment');
const datepipe = require('date-and-time');
const OSESLogger = require('../../helpers/mawgifLogger');

const Fixed_Bu_Cd = '900';
const Fixed_Route_Cd = '01';
const Fixed_Pda_Cd = '0000000574';
const Fixed_Remarks = 'datategy CN';
const Fixed_Vrm_Ticket_Printed = '1'; // Ticket Printed!
const Fixed_Ticket_No = '1';

const CN_Pay_Type_Cd = '0000000001';
const TOW_Pay_Type_Cd = '0000000002';
const CLAMP_Pay_Type_Cd = '0000000004';

/**
 * Create OSES VRM Code
 * @param data: CN Data
 * {
 *    cn_number_offline,
 *    car_plate,
 *    car_plate_ar,
 *    violation_code,
 *    observation_time,
 *    plate_type_code,
 *    car_brand_id,
 *    car_model_id,
 *    car_color_id,
 *    plate_picture,
 *    violation_picture,
 *    city_cd,
 *    street_cd,
 *    intersection_cd,
 *    project_gmt,
 *    creator_id,
 * }
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<Promise<*>|Promise<*>>}
 */
const createMawgifVRM = async (data, req = null) => {
    let finished_time = moment(data.creation)
        .add(data.observation_time, 'm')
        .toDate()
        .toISOString();

    let Zone_Cd;
    let City_Cd = data.city_cd;
    let zone = await getZoneByCity(City_Cd);
    if (zone && zone.data && zone.data.length > 0) {
        Zone_Cd = zone.data[0].Zone_Cd;
    }

    // removes the space between the Arabic characters \u200c == 8204 in decimal
    let carPlate = '';
    for (let i = 0; i < data.car_plate_ar.length; i++) {
        let c = data.car_plate_ar.codePointAt(i);
        if(c !== 8204) {
            carPlate += data.car_plate_ar.charAt(i);
        }
    }

    const Vrm_Cd = data.cn_number_offline;

    const Vrm_DateTime = formatDate(data.creation, data.project_gmt)
        .toString()
        .toUpperCase();
    const Finish_Time_Observation = formatDate(finished_time, data.project_gmt)
        .toString()
        .toUpperCase();

    const platePicture = data.plate_picture || '';
    const violationPicture = data.violation_picture || '';

    let body = {
        data: {
            Bu_cd: Fixed_Bu_Cd,
            Vrm_Cd: Vrm_Cd,
            License_Plate: carPlate,
            Lp_Type_Cd: data.plate_type_code,
            Make_Cd: data.car_brand_id,
            Model_Cd: data.car_model_id,
            Color_Cd: data.car_color_id,
            Vrm_Eo_Cd: data.creator_id, // TODO: should consider whether to use req.body.creator_id or token.employee_id
            Violation_Cd: data.violation_code,
            City_Cd: data.city_cd,
            Route_Cd: Fixed_Route_Cd,
            Zone_Cd: Zone_Cd,
            Street_Cd: data.street_cd,
            Intersection_Cd: data.intersection_cd,
            Vrm_DateTime: Vrm_DateTime,
            Finish_Time_Observation: Finish_Time_Observation,
            pda_Cd: Fixed_Pda_Cd,
            // Violation_Recorded: will be updated to '1' by UpdateVRM API
            // right after ticket and job is created in OSES
            Violation_Recorded: '0',
            plate_pic_path: platePicture,
            violation_pic_path: violationPicture,
            Remarks: Fixed_Remarks,
        }
    };
    OSESLogger('info', { subject: 'CreateVRM-request', message: body }, req);

    let options = {
        url: 'MawgifAPI/api/Enforcement/CreateVRM',
        headers: {
            'Content-Type': 'application/json',
        },
        body: body,
    };

    return mawgifAPI.post(options);
};

/**
 * Update OSES VRM Code
 * @param data
 * {
 *     reference
 * }
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise}
 */
const updateMawgifVRM = async (data, req = null) => {
    let body = {
        data: {
            violation_recorded: '1',
        }
    };

    const VrmCd = data.reference;
    OSESLogger('info', { subject: 'UpdateVRM-request', message: body }, req);
    let options = {
        url: `MawgifAPI/api/Enforcement/UpdateVRM/${Fixed_Bu_Cd},${VrmCd}`,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body,
    };

    return mawgifAPI.put(options);
};

/**
 * Create OSES Ticket
 * @param data
 * {
 *     reference: CN, Job's reference - OSES VRMCode
 *     amount: Violation(CN).amount, not Job.amount(violation.amount + job.service_fee)
 *     creation: Direct CN
 *     evolved_into_cn_at: Transformed CN
 *     project_gmt: project's GMT offset
 * }
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<Promise<*>|Promise<*>>}
 */
const createMawgifTicket = async (data, req = null) => {

    let ticketData = data.evolved_into_cn_at ? data.evolved_into_cn_at : data.creation;
    ticketData = formatDate(ticketData, data.project_gmt)
        .toString()
        .toUpperCase();

    let body = {
        data: {
            Bu_Cd: Fixed_Bu_Cd,
            Vrm_Cd: data.reference,
            Vrm_Ticket_Printed: Fixed_Vrm_Ticket_Printed,
            Ticket_DateTime: ticketData,
            Ticket_No: Fixed_Ticket_No,
            Ticket_Rate: data.amount,
            Ticket_Paid: '0', // Unpaid status
            Pda_Cd: Fixed_Pda_Cd,
        }
    };

    let options = {
        url: 'MawgifAPI/api/Enforcement/CreateTicket',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    };
    OSESLogger('info', { subject: 'CreateTicket-request', message: body }, req);
    return mawgifAPI.post(options);
};

/**
 * Create OSES Job
 * @param data: CN + Job Data
 * {
 *     reference,
 *     violation_code,
 *     creation,
 *     project_gmt,
 * }
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<Promise<*>|Promise<*>>}
 */
const createMawgifJob = async (data, req = null) => {
    // first create the VRM
    // Step: get VRM CODE
    if (!data.reference) {
        const result = await createMawgifVRM(data, req);
        OSESLogger('info', { subject: 'CreateVRM-result', message: result }, req);
        if (result.data === null){
            return;
        }
        data.reference = result.data[0].Vrm_Cd;
    }

    // Step: create the Job
    let date = formatDate(data.creation, data.project_gmt)
        .toString()
        .toUpperCase();

    let body = {
        data: {
            Bu_Cd: Fixed_Bu_Cd,
            Vrm_Cd: data.reference,
            Ticket_DateTime: date,
            Violation_Cd: data.violation_code,
            Pda_Cd: Fixed_Pda_Cd,
        }
    };
    OSESLogger('info', { subject: 'CreateOSESJob-request', message: body }, req);
    let options = {
        url: 'MawgifAPI/api/Enforcement/CreateJob',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body,
    };
    return mawgifAPI.post(options);
};

/**
 *
 * @param data: PaymentDetails in Cashier
 * {car_plate, car_type_code, vat_percentage, amount_due, employee_id}
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<*>}
 */
const createMawgifPayment = async (data, req = null) => {
    OSESLogger('info', { subject: 'CreateOSESPayment-TicketData', message: data }, req);

    let contraventions_Net_Amount = 0;
    let contraventions_Vat_Amount = 0;
    let services_Net_Amount = 0;
    let services_Vat_Amount = 0;

    const { paid_contraventions, paid_jobs } = data;

    try {
        data.car_plate = cnService.removeSpecialCharsInPlate(data.car_plate);
        let body = {
            Bu_Cd: '900',
            Pound_Cd: '0000000003',
            Employee_Id: data.employee_id,
            Pay_Method_Cd: 'CASH',
            Plate_No: data.car_plate,
            Plate_Type: data.car_type_code,
            CN_Info: [],
            Vat_Percentage: `${data.vat_percentage}`,
            Vat_Amount: `${data.amount_due * data.vat_percentage / 100}`,
            Net_Amount: `${data.amount_due}`,
            Total_Amount: `${data.amount_due * (1 + (data.vat_percentage / 100))}`
        };

        if (paid_contraventions) {
            paid_contraventions.forEach(cn => {
                contraventions_Net_Amount += cn.amount;
                contraventions_Vat_Amount += cn.amount * data.vat_percentage / 100;

                body.CN_Info.push({
                    Pay_Type_Cd: CN_Pay_Type_Cd,
                    Vrm_Cd: cn.reference ? `${cn.reference}` : '',
                    CN_Amount: `${cn.amount}`,
                    Vat_Percentage: `${data.vat_percentage}`,
                    Vat_Amount: `${cn.amount * data.vat_percentage / 100}`,
                    Net_Amount: `${cn.amount}`,
                    Total_Amount: `${cn.amount * (1 + data.vat_percentage / 100)}`
                });
            });
        }

        if (paid_jobs) {
            paid_jobs.forEach(job => {
                services_Net_Amount += job.amount;
                services_Vat_Amount += job.amount * data.vat_percentage / 100;

                let Pay_Type_Cd = null;
                switch (job.job_type) {
                    case 'TOW JOB':
                        Pay_Type_Cd = TOW_Pay_Type_Cd;
                        break;
                    case 'CLAMP JOB':
                        Pay_Type_Cd = CLAMP_Pay_Type_Cd;
                        break;
                    default:
                }

                body.CN_Info.push({
                    Pay_Type_Cd: Pay_Type_Cd,
                    Vrm_Cd: job.reference ? `${job.reference}` : '',
                    CN_Amount: `${job.amount}`,
                    Vat_Percentage: `${data.vat_percentage}`,
                    Vat_Amount: `${job.amount * data.vat_percentage / 100}`,
                    Net_Amount: `${job.amount}`,
                    Total_Amount: `${job.amount * (1 + data.vat_percentage / 100)}`
                });
            });
        }

        body.Vat_Amount= services_Vat_Amount + contraventions_Vat_Amount;
        body.Net_Amount= services_Net_Amount + contraventions_Net_Amount;
        body.Total_Amount=  body.Vat_Amount + body.Net_Amount;

        OSESLogger('info', { subject: 'CreateOSESPayment-request', message: body }, req);
        const options = {
            url: 'MawgifAPI/api/Enforcement/CNPayment',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
        };
        const response = await mawgifAPI.post(options);
        OSESLogger('info', { subject: 'CreateOSESPayment-result', message: response }, req);

        if (!response || !response.data) {
            // {"name":"CNPayment","error_code":"400 - BadRequest",
            //  "message":"CN [] not found in parent table.","data":null}
            throw new Error(`API Response ${JSON.stringify(response)}`);
        }

        // {"name": "CNPayment","error_code": "0",
        //  "message": "Success","data": "542395"}
        OSESLogger('info', { subject: 'CreateOSESPayment-success', message: response }, req);
        return response;
    } catch (err) {
        OSESLogger('error', { subject: 'CreateOSESPayment-error', message: err.message }, req);
        throw new Error(`OSES CN Payment API Error: ${err.message}`);
    }
};

/*
 * Job_status :
 *  - 1 = select job
 *  - 2 = Cancel
 * Job_Type :
 *  - T
 *  - C
*/
// const AcceptCancelJob = async (data) => {
//   let seq = await nextVRMSeq('DATATEGY');
//   let Vrm_Cd = `676${seq.data}`;
//   let body = {
//     data: {
//       Bu_Cd: Fixed_Bu_Cd,
//       Vrm_Cd: Vrm_Cd,
//       Tow_Truck_Cd: data.Tow_Truck_Cd,
//       Tow_Driver_Cd: data.Tow_Driver_Cd,
//       Truck_Reg_No: data.Truck_Reg_No,
//       Job_Type: data.job_type.toUpperCase().includes('TOW') ? 'T' : 'C',
//       Job_Status: data.job_status,
//     }
//   };
//
//   let options = {
//     url: 'MawgifAPI/api/Enforcement/AcceptJob',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: body,
//   };
//
//   return mawgifAPI.post(options);
// };

/**
 * url can be ZoneByName or StreetByName or IntersectionByName
 * name is the name that we are looking for in mawgif database
 * @param url
 * @param name
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise}
 */
const getByName = (url, name, req = null) => {
    let options = {
        url: `MawgifAPI/api/Master/${url}/${name}`,
        headers: {
            'Content-Type': 'application/json',
        },
        qs: {},
    };
    return mawgifAPI.get(options);
};

/**
 *  example CityCd : JED
 * @param CityCd
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise}
 */
const getZoneByCity = function(CityCd, req = null) {
    let options = {
        url: `MawgifAPI/api/Master/ZoneByCity/${CityCd}`,
        headers: {
            'Content-Type': 'application/json',
        },
        qs: {},
    };
    return mawgifAPI.get(options);
};

const nextVRMSeq = function(deviceName) {
    let options = {
        url: `MawgifAPI/api/Master/NextVrMSeq/${deviceName}`,
        headers: {
            'Content-Type': 'application/json',
        },
        qs: {},
    };
    return mawgifAPI.get(options);
};

/**
 * @param date
 * @param projectGMT
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {*}
 */
const formatDate = function(date, projectGMT, req = null) {
    OSESLogger('info', {
        subject: 'formatDate',
        message: `${typeof date}-${date}, ${typeof projectGMT}-${projectGMT}`
    }, req);
    date = new Date(date);
    const GMT_Date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const Project_Date = datepipe.addHours(GMT_Date, projectGMT);

    return datepipe.format( Project_Date, 'DD-MMM-YYYY HH:mm:ss');
};

const FindAdress = (City_Cd, zone, intersection, street) => {
    let res = {};
    if (
        City_Cd &&
        zone &&
        street &&
        intersection &&
        street.message === 'Success' &&
        intersection.message === 'Success' &&
        zone.message === 'Success'
    ) {
        intersection = intersection.data;
        street = street.data;
        zone = zone.data;
        zone.forEach(z => {
            if (z.City_Cd === City_Cd) res.zone = z;
        });
        street.forEach(s => {
            if (s.City_Cd === City_Cd) res.street = s;
        });
        if (res['street'] && res['zone']) {
            intersection.forEach(i => {
                if (i.City_Cd === City_Cd && i.Street_Cd === res.street.Street_Cd)
                    res.intersection = i;
            });
            if (res['intersection']) return res;
        }
    }
    return null;
};

exports.createMawgifVRM = createMawgifVRM;
exports.updateMawgifVRM = updateMawgifVRM;
exports.createMawgifTicket = createMawgifTicket;
exports.createMawgifJob = createMawgifJob;
exports.createMawgifPayment = createMawgifPayment;
exports.getByName = getByName;
// exports.AcceptCancelJob = AcceptCancelJob;
