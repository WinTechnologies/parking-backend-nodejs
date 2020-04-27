const paymentResult = (result, paymentModes) => {
    const total = result.reduce((sum, value) => {
        sum += +value.rows[0].count;
        return sum;
    }, 0);
    return result.reduce((obj, mode, i) => {
        obj[paymentModes[i]] = Math.round((mode.rows[0].count / total) * 100);
        return obj;
    }, {});
};

exports.paymentResult = paymentResult;