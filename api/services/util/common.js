const moment = require('moment');
/**
 * Decode base64 image
 *.e.g. data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAAAPAQMAAABeJUoFAAAABlBMVEX///8AAABVwtN+AAAAW0lEQVQImY2OMQrAMAwDjemgJ3jI0CFDntDBGKN3hby9bWi2UqrtkJAk8k/m5g4vGBCprKRxtzQR3mrMlm2CKpjIK0ZnKYiOjuUooS9ALpjV2AjiGY3Dw+Pj2gmnNxItbJdtpAAAAABJRU5ErkJggg==
 */
exports.decodeBase64Image = (dataString) => {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}
/**
 * return the directory path with the {path}/YYYY/MM
 */
exports.uploadUri = (path) => {
    return `${path}/${moment().format('YYYY')}/${moment().format('MM')}`;
}

/**
 * return the difference between the two dates in minutes.
 */
exports.getMinutesBetweenDates = (startDate, endDate) => {
    const timeZoneOffset = endDate.getTimezoneOffset();

    let diff = (endDate.getTime() - startDate.getTime()) / 60000;
    if (timeZoneOffset < 0) {
        diff = parseInt(diff + timeZoneOffset);
    } else {
        diff = parseInt(diff - timeZoneOffset);
    }
    return diff;
}

/**
 * return the directory path with the {path}/YYYY/MM
 */
exports.ftpUploadUri = (path) => {
    return `${path}/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}`;
}
