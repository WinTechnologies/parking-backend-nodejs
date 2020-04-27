/**
 *
 * @type {ReadonlyArray<string>}
 */
const commonRequiredFields = Object.freeze([
    'cn_number_offline',
    'car_plate', 'car_plate_ar',
    'car_brand_id', 'car_brand', 'car_brand_ar',
    'car_color_id', 'car_color', 'car_color_ar',
    'car_model_id', 'car_model', 'car_model_ar',
    'car_type', 'car_type_ar',
    'plate_country', 'plate_country_ar',
    'plate_type_code', 'plate_type','plate_type_ar',
    'plate_picture',
    'latitude', 'longitude',
    'project_id', 'zone_id', 'city_cd',
    'address_simplified',
    'street_cd', 'street_name_en', 'street_name_ar',
    'intersection_cd', 'intersection_name_en', 'intersection_name_ar',
    'violation', 'violation_id', 'violation_code', 'violation_ar',
    'violation_picture',
    'assignment_id', 'observation_time', 'amount',
    'creator_id', 'creator_username',
    'sent_by',
    'status',
    'notes'
]);

/**
 *
 * @type {ReadonlyArray<string>}
 */
const commonOptionalFields = Object.freeze([
    'evolved_into_cn_at',
]);

/**
 *
 * @type {ReadonlyArray<string>}
 */
const mapsRequiredFields = Object.freeze([
    'violation_decision',
]);

/**
 *
 * @type {ReadonlyArray<string>}
 */
const mapsOptionalFields = Object.freeze([
    'is_nonpayment',
    'deleteStatus', // '0',
    'is_virtual_ticket_checked', // '1',
    'online',       // 0,
    'sent_at',      // '2020-01-09T18:07:50.257+0100',
    'creation',     // '2020-01-27T17:29:53.649+0100',
    'country_authority_code',
    'creationObs',
    'localPlatePicture',
    'localVehiclePicture',
    'local_violation_picture',
    'local_map_picture',
    'site_id',
    'site_name',
    'review_status',
    'project_gmt',
    'vat_id',
    'observation_number'
]);

const mapsNumberFields = Object.freeze([
    'assignment_id',
    'car_brand_id',
    'car_model_id',
    'car_color_id',
    'project_id',
    'zone_id',
    'violation_id',
    'latitude', 'longitude',
    'observation_time',
    'amount',
]);

const osesNumberFields = Object.freeze([
    'assignment_id',
    // TODO: fix in OSES integration service: They don't save car_brand_id and car_model_id
    //  "car_brand":"HYUNDAI","car_brand_ar":"هونداي","car_brand_id":null,
    //  "car_model":"","car_model_ar":"","car_model_id":null
    // 'car_brand_id',
    // 'car_model_id',
    'car_color_id',
    'project_id',
    'zone_id',
    'violation_id',
    'latitude', 'longitude',
    'observation_time',
    'amount',
]);

/**
 * other fields in request body in Create CN API
 * @type {ReadonlyArray<string>}
 */
const nonInsertCNColumns = Object.freeze([
    'cn_number',
    'creationObs',
    'country_authority_code',
    'deleteStatus',
    'is_nonpayment',
    'is_virtual_ticket_checked',
    'car_plate_print_ar',
    'localPlatePicture',
    'localVehiclePicture',
    'local_violation_picture',
    'local_map_picture',
    'online',
    'violation_decision',
    'site_id',
    'site_name',
    'review_status',
    'project_gmt',
    'vat_id',
    'observation_number'
]);
exports.nonInsertCNColumns = nonInsertCNColumns;

/**
 * check if any missing fields that are required
 * @param cn
 * @returns {string[]}
 */
exports.checkMissingRequiredFields = (cn) => {
    const cnFields = Object.keys(cn);
    if (cn.sent_by && cn.sent_by === 'MAPS') {
        return [...commonRequiredFields, ...mapsRequiredFields].filter(i => {
            return cnFields.indexOf(i) === -1; // Allow Null || cn[i] === null
        });
    } else {
        return commonRequiredFields.filter(i => {
            return cnFields.indexOf(i) === -1; // Allow Null || cn[i] === null
        });
    }
};

/**
 * Initiate missing fields in all available fields to 0 or ''
 * @param cn
 * @returns {*}
 */
exports.checkMissingOptionalFields = (cn) => {
    const nanFields = [];
    if (cn.sent_by && cn.sent_by === 'MAPS') {
        mapsNumberFields.forEach(field => {
            // reasonably used == operator to accept both string and number,
            // for example 30 and '30', '30.0'
            if (cn[field] == parseFloat(cn[field])) {
                cn[field] = parseFloat(cn[field]);
            } else {
                nanFields.push(field);
            }
        });
    } else {
        osesNumberFields.forEach(field => {
            // reasonably used == operator to accept both string and number,
            // for example 30 and '30', '30.0'
            if (cn[field] == parseFloat(cn[field])) {
                cn[field] = parseFloat(cn[field]);
            } else {
                nanFields.push(field);
            }
        });
    }

    const cnFields = Object.keys(cn);
    if (cn.sent_by && cn.sent_by === 'MAPS') {
        const missedOptionalFields = [...commonOptionalFields, ...mapsOptionalFields, 'cn_number']
            .filter(i => cnFields.indexOf(i) === -1); // Allow Null || cn[i] === null
        missedOptionalFields.forEach(x => cn[x] = '');
        return { nanFields, missedOptionalFields, castedData: cn };

    } else {
        const missedOptionalFields = [...commonOptionalFields, 'cn_number']
            .filter(i => cnFields.indexOf(i) === -1); // Allow Null || cn[i] === null
        missedOptionalFields.forEach(x => cn[x] = '');
        return { nanFields, missedOptionalFields, castedData: cn };
    }
};

