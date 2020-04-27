const { printLog } = require('./consoleLogger');
const { createBulkInserter } = require('./../api/pg/log-metadata/controller');

const log = require('simple-node-logger').createRollingFileLogger({
    // logFilePath:'logs/mawgifapicall.log',
    logDirectory:'logs', // NOTE: folder must exist and be writable...
    fileNamePattern:'mawgifapicall-<DATE>.log',
    dateFormat:'YYYY.MM.DD',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS',
});

const BulkInsertPayload = 20;
const logBulkInserter = createBulkInserter(BulkInsertPayload);

const loggerCategory = 'Mawgif.WebServices.Logs.logger';

/**
 *
 * @param level
 * @param data <{ subject, message }>
 * @param request
 *  <{baseUrl, originalUrl, method, param, query, body} | null>
 * @returns {Promise<void>}
 */
module.exports = async (level, data, request = null) => {
    printLog(level, data.subject, ': ', JSON.stringify(data.message));

    switch (level) {
        case 'error':
            log.error(data.subject, ': ', data.message);
            break;

        case 'warn':
            log.warn(data.subject, ': ', data.message);
            break;

        case 'info':
            log.info(data.subject, ': ', data.message);
            break;

        case 'log':
            log.trace(data.subject, ': ', data.message);
            break;

        case 'debug':
            log.debug(data.subject, ': ', data.message);
            break;

        default:
    }

    const logData = {
        log_level: level,
        logger: loggerCategory,
        api: request ? `${request.method} ${request.originalUrl}` : '',
        function_name: data.subject,
        messages: JSON.stringify(data.message),
        created_at: new Date(),
    };
    await logBulkInserter.push(logData);
};
