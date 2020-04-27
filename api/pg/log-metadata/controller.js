const cargo = require('async/cargo');
const logMetaModel = require('../sequelize-models').log_metadata;

/**
 * Save logs into DB
 * @param log_level
 * @param logger
 * @param api
 * @param function_name
 * @param messages
 * @returns {Promise<void>}
 */
const saveLogIntoDB = async (log_level, logger, api, function_name, messages) => {
      const logMetaBody = { log_level, logger, api, function_name, messages, created_at: new Date() };
      return await logMetaModel.create(logMetaBody);
};

/**
 * Returns Async Cargo Object for bulk insertion of log data
 * @param BulkInsertPayload
 * @returns {*}
 */
const createBulkInserter = (BulkInsertPayload) => {
    /**
     *  Logs <[{
     *      log_level: string, logger: string,
     *      api: number, function_name: number,
     *      messages: string, created_at: date,
     *  }]>
     */
    return cargo(async (logs, callback) => {
        try {
            await logMetaModel.bulkCreate(logs);
            console.log(`Saved ${logs.length} logs into DB`);
            if (callback) callback();
        } catch (err) {
            console.error(`While saving logs ${err.message}: ${logs}`);
        }
    }, BulkInsertPayload);
};

// TODO: create get logs API to show on web UI
// TODO: check: logs don't need to be created by API call.
const create = async (req, res, next) => {
    try {
      const { log_level, logger, api, function_name, messages } = req.body;
      const result = await saveLogIntoDB( log_level, logger, api, function_name, messages );
      return res.status(200).json({ message: 'created.', id: result.id });
    } catch (err) {
        next(err);
    }
};

exports.saveLogIntoDB = saveLogIntoDB;
exports.createBulkInserter = createBulkInserter;
exports.create = create;

