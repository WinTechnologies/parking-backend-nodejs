const paymentResult = (result) => {
    if (!result.length) {
        return null;
    }
    const total = result.reduce((sum, value) => sum + (+value.rows[0].count), 0);
    result = result.reduce((obj, mode, i) => {
        obj[payment_mode] = Math.round((mode.rows[0].count / total) * 100);
        return obj;
    }, {});
    return result;
};

exports.paymentResult = paymentResult;