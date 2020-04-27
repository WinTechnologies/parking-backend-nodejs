
/**
 * TODO: logging in workers
 * @param level - error, warn, info, log, debug
 * @param data
 */
exports.printLog = (level, ...data) => {

    switch (level) {
        case 'error':
            console.error(...data);
            break;

        case 'warn':
            console.warn(...data);
            break;

        case 'info':
            // if (process.env.NODE_ENV !== 'production') {
                console.info(...data);
            // }
            break;

        case 'log':
            // if (process.env.NODE_ENV !== 'production') {
                console.log(...data);
            // }
            break;

        case 'debug':
            // if (process.env.NODE_ENV !== 'production') {
                console.debug(...data);
            // }
            break;

        default:
    }
};
