const date = require('date-and-time');

const defaultFormat = 'YYYY-MM-DD';

now = (format = defaultFormat) => {
    return date.format(new Date(), format);
}

exports.parseDate = (dt = null, format = defaultFormat) => {
    if (dt) {
        return date.parse(dt, format, true);
    }

    return date.parse(now(format), format, true);
}

exports.format = (dt, format = defaultFormat) => {
    return date.format(dt, format);
}
