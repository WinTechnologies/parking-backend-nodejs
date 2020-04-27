/**
 * RequiredFields
 * @type {ReadonlyArray<string>}
 */
const requiredFields = Object.freeze([
    'ticket_number',        // string 'T1581406377869'
    'car_plate',            // string '9999NNN'
    'car_type',             // string 'DIPLOMATIC (GREEN)'
    'car_type_code',        // string '2'
    'amount_promo',         // number 0
    'amount_due',           // number 200
    'amount_vat',           // number 10
    'amount_total',         // number 210
    'project_id',           // number 91
    'vat_id',               // number 1
    'vat_percentage',       // number 5
    // 'transaction',
    'tendered',             // number 300
    'change',               // number 90
    'paid_mode',            // string 'cash' | 'card'
    'is_paid',              // boolean true
    'paid_contraventions',  // RequiredCNFields[]
    'paid_jobs',            // RequiredJobFields[]
    // 'detail_services',   // { amount: 0, services: [] }
]);

/**
 * Numeric Fields
 * @type {ReadonlyArray<string>}
 */
const numberFields = Object.freeze([
    'amount_promo',
    'amount_due',
    'amount_vat',
    'amount_total',
    'project_id',
    'vat_id',
    'vat_percentage',
    'tendered',
    'change',
]);

/**
 * RequiredCNFields: CN Fields for payment
 * @type {ReadonlyArray<string>}
 */
const requiredCNFields = Object.freeze([
    'cn_number_offline',    // string
    'amount',               // number
    // 'reference',         // optional string
]);

/**
 * RequiredJobFields: Job Fields for payment
 * @type {ReadonlyArray<string>}
 */
const requiredJobFields = Object.freeze([
    'job_number',       // string
    'amount',           // number
    'job_type',         // string
    'status',           // string (from mobile)
    // 'job_status',    // optional string (from FE)
    // 'reference',     // optional string
]);

/**
 * Check if any missing fields that are required in a ticket
 * @param ticketData: <RequiredFields>
 * @returns {string[]}
 */
exports.checkMissingRequiredFields = ticketData => {
    const fields = Object.keys(ticketData);
    const { paid_jobs } = ticketData;
    if (paid_jobs && paid_jobs.length > 0) {
        // Note: FE sends as paid_job.job_status, Mobile sends as paid_job.status
        paid_jobs.forEach(job => {
            if (job === 'job_status') {
                job['status'] = job['job_status'];
            }
        });
    }
    return requiredFields.filter((field) => fields.indexOf(field) === -1);
};

/**
 * Check if any missing fields that are required in a CN
 * @param cnData <RequiredCNFields>
 * @returns {string[]}
 */
exports.checkCNFields = cnData => {
    let missingFields = [];
    cnData.forEach(cn => {
        const fields = Object.keys(cn);
        missingFields = [
            ...missingFields,
            ...requiredCNFields.filter((field) => fields.indexOf(field) === -1),
        ];
    });
    return [...new Set(missingFields)];
};

/**
 * Check if any missing fields that are required in a job
 * @param jobData <RequiredJobFields>
 * @returns {{missingJobFields: string[], invalidJobNumbers: number[]}}
 */
exports.checkJobFields = jobData => {
    let missingJobFields = [], invalidJobNumbers = [];
    jobData.forEach(job => {
        const fields = Object.keys(job);
        missingJobFields = [
            ...missingJobFields,
            ...requiredJobFields.filter((field) => fields.indexOf(field) === -1),
        ];
        if (job.status !== 'CLAMPED' && job.status !== 'TOWED') {
            invalidJobNumbers.push(job.job_number);
        }
    });
    return {
        missingJobFields: [...new Set(missingJobFields)],
        invalidJobNumbers: [...new Set(invalidJobNumbers)],
    }
};

/**
 * Check if any NaN values for numeric fields in a ticket
 * @param ticketData: <RequiredFields>
 * @returns {{nanFields: string[], castedData: any}}
 */
exports.checkAndCastNaNFields = ticketData => {
    const nanFields = [];
    numberFields.forEach(field => {
        // reasonably used == operator to accept both string and number,
        // for example 30 and '30',
        if (ticketData[field] == parseFloat(ticketData[field])) {
            ticketData[field] = parseFloat(ticketData[field]);
        } else {
            nanFields.push(field);
        }
    });
    return { nanFields, castedData: ticketData };
};
