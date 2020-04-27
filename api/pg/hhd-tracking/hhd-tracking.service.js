const cargo = require('async/cargo');
const hhdTrackingModel = require('../sequelize-models').hhd_tracking;

/**
 * @param data <{imei: string, serial_number: string,
 *  latitude: number, longitude: number,
 *  device_mode: string, battery_status: string,
 *  battery_level: number, application_name: string,
 *  user_status: number, user_id: string}>
 * @returns {Promise<*>}
 */
const createHhdTracking = async (data) => {
    try{
        const hhdTracking = await hhdTrackingModel.create(data);
        if (hhdTracking) {
            return hhdTracking.imei;
        } else {
            return null;
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Returns Async Cargo Object for bulk insertion of HHD tracking data
 * @param BulkInsertPayload
 * @returns {*}
 */
const createBulkInserter = (BulkInsertPayload) => {
    /**
     *  hhdRecords <[{
     *      imei: string, serial_number: string,
     *      latitude: number, longitude: number,
     *      device_mode: string, battery_status: string,
     *      battery_level: number, application_name: string,
     *      user_status: number, user_id: string,
     *  }]>
     */
    return cargo(async (hhdRecords, callback) => {
        try {
            await hhdTrackingModel.bulkCreate(hhdRecords);
            console.log(`Saved ${hhdRecords.length} hhd-tracking records into DB`);
            if (callback) callback();
        } catch (err) {
            console.error(`While saving hhd-tracking records ${err.message}: ${hhdRecords}`);
        }
    }, BulkInsertPayload);
};

exports.createHhdTracking = createHhdTracking;
exports.createBulkInserter = createBulkInserter;
