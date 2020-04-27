var client = require('../helpers/cassandraClient');
const Uuid = require('cassandra-driver').types.Uuid;

const tableNameProducts = 'products';
const tableNameProductsDays = 'products_days';
const tableNameClientType = 'client_type';
const tableNameProductsIntervalTime = 'products_interval_time';
const tableNameProductsPaymentMethods = 'products_payment_methods';

//table: products
const tableFieldsGet = [
    'id',
    'name',
    'client_type',
    'price_type',
    'time_unit',
    'project_id',
    'site_id',
    'begin_date',
    'end_date',
    'time_created',
    'price_per_time_unit',
    'amount_of_unit',
    'initial_time_unit_price',
    'growth_factor',
    'time_segments',
    'price',
    'fixed_price',
    'status',
    'valet_system',
];
const tableFieldsPost = [
    'id',
    'name',
    'client_type',
    'price_type',
    'time_unit',
    'project_id',
    'site_id',
    'begin_date',
    'end_date',
    'time_created',
    'price_per_time_unit',
    'amount_of_unit',
    'initial_time_unit_price',
    'growth_factor',
    'time_segments',
    'price',
    'fixed_price',
    'status',
    'valet_system',
];
const tableFieldsPut = [
    'name',
    'client_type',
    'price_type',
    'time_unit',
    'project_id',
    'site_id',
    'begin_date',
    'end_date',
    'price_per_time_unit',
    'amount_of_unit',
    'initial_time_unit_price',
    'growth_factor',
    'time_segments',
    'price',
    'fixed_price',
    'status',
    'valet_system',
];

//table: products_days

const countDays = 7;
const tableFieldsDayPost = [
    'id',
    'name',
    'number',
    'product_id',
    'checked',
];
const tableFieldsDayGet = [
    'id',
    'name',
    'number',
    'product_id',
    'checked',
];
const tableFieldsDayPut = [
    'name',
    'checked',
];

//table: client_type
const tableFieldsClientTypeGet = [
    'id',
    'name',
];


//table: products_interval_time
const tableFieldsIntervalTimeGet = [
    'id',
    'start',
    'end',
    'value',
    'type',
    'product_id',
    'number',
];

const tableFieldsIntervalTimePost = [
    'id',
    'start',
    'end',
    'value',
    'type',
    'product_id',
    'number',
];


//table products_payment_methods
const tableFieldsPaymentMethodsGet = [
    'id',
    'product_id',
    'name',
    'checked',
    'percent',
];
const tableFieldsPaymentMethodsPost = [
    'id',
    'product_id',
    'name',
    'checked',
    'percent',
];


/**
 * @param {*} data
 * @returns {*}
 */
exports.create = (data) => {
    let queryStr = "INSERT INTO " + tableNameProducts + " (" + tableFieldsPost.join(', ') + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        productId = Uuid.random(),
        createField = [
            productId,
            String(data.name),
            String(data.client_type),
            String(data.price_type),
            String(data.time_unit),
            String(data.project_id),
            String(data.site_id),
            new Date(data.begin_date),
            new Date(data.end_date),
            (new Date()).getTime(),
            Number(data.price_per_time_unit),
            Number(data.amount_of_unit),
            Number(data.initial_time_unit_price),
            Number(data.growth_factor),
            String(data.time_segments),
            Number(data.price),
            Number(data.fixed_price),
            String(data.status),
            Number(data.valet_system),
        ];
    let queryList = [{query: queryStr, params: createField}];


    if (productId) {
        if (data.hasOwnProperty('days') && Array.isArray(data.days)) {
            for (let i = 0; i < countDays; i++) {
                let fields;
                if (data.days[i]) {
                    let day = data.days[i];
                    fields = [
                        String(day.name),
                        i,
                        productId,
                        Number(day.checked),
                    ];
                } else {
                    fields = [
                        '', //name
                        i, //number
                        productId,
                        0, //checked
                    ];
                }
                queryList.push({
                    query: "INSERT INTO " + tableNameProductsDays + " (" + tableFieldsDayPost.join(', ') + ") VALUES (uuid(), ?, ?, ?, ?)",
                    params: fields
                });
            }
        }

        if (data.hasOwnProperty('intervals') && Array.isArray(data.intervals) && data.intervals.length > 0) {
            data.intervals.forEach((el, index) => {
                if (el) {
                    if (el.end === "24:00") {
                        el.end = "23:59"
                    }
                    let params = [
                        el.start,
                        el.end,
                        Number(el.value),
                        Number(el.type),
                        productId,
                        Number(el.number),
                    ];

                    queryList.push({
                        query: "INSERT INTO " + tableNameProductsIntervalTime + "(" + tableFieldsIntervalTimePost.join(', ') + ") VALUES (uuid(), ?, ?, ?, ?, ?, ?)",
                        params: params,
                    });
                }
            });
        }

        if (data.hasOwnProperty('payment_methods') && Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
            data.payment_methods.forEach((el, index) => {
                let params = [
                    productId,
                    String(el.name),
                    Number(el.checked),
                    Number(el.percent),
                ];

                queryList.push({
                    query: "INSERT INTO " + tableNameProductsPaymentMethods + "(" + tableFieldsPaymentMethodsPost.join(', ') + ") VALUES (uuid(), ?, ?, ?, ?)",
                    params: params,
                });
            });
        }
    }

    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});

    return null;
};

/**
 *
 * @param data
 * @returns {*}
 */
exports.get = (data) => {
    if (data.id) {
        let query = "SELECT " + tableFieldsGet.join(', ') + " FROM " + tableNameProducts + " WHERE id = ?";
        return client.execute(query, [data.id], {prepare: true});
    } else if (data.name) {
        let query = "SELECT " + tableFieldsGet.join(', ') + " FROM " + tableNameProducts + " WHERE name = ? ALLOW FILTERING";
        return client.execute(query, [data.name], {prepare: true});
    } else if (data.project_id) {
        let query = "SELECT " + tableFieldsGet.join(', ') + " FROM " + tableNameProducts + " WHERE project_id = ? ALLOW FILTERING";
        return client.execute(query, [data.project_id], {prepare: true});
    } else if (data.site_id) {
        let query = "SELECT " + tableFieldsGet.join(', ') + " FROM " + tableNameProducts + " WHERE site_id = ? ALLOW FILTERING";
        return client.execute(query, [data.site_id], {prepare: true});
    } else {
        let query = "SELECT " + tableFieldsGet.join(', ') + " FROM " + tableNameProducts;
        return client.execute(query, [], {prepare: true});
    }
};

/**
 *
 * @param data
 * @returns {*}
 */
exports.getForCalendar = (data) => {
    if (data.site_id && data.client_type && data.start && data.end) {
        let query = "SELECT " + tableFieldsGet.join(', ') + " FROM " + tableNameProducts + " WHERE site_id = ? AND client_type <= ? AND end_date >= ? AND begin_date <= ? ALLOW FILTERING";
        return client.execute(query, [data.site_id, data.client_type, data.start, data.end], {prepare: true});
    } else {
        let query = "SELECT " + tableFieldsGet.join(', ') + " FROM " + tableNameProducts;
        return client.execute(query, [], {prepare: true});
    }
};

/**
 *
 * @param data
 * @returns {Promise.<*[]>}
 */
exports.update = (data) => {
    if (data.hasOwnProperty('begin_date')) data.begin_date = new Date(data.begin_date);
    if (data.hasOwnProperty('end_date')) data.end_date = new Date(data.end_date);
    let queryList = [];
    // if(data.hasOwnProperty('days')) delete data.days;
    // if(data.hasOwnProperty('intervals')) delete data.intervals;

    if (data === Object(data)) {
        Object.keys(data).forEach((key, index, arrayOfKeys) => {
            if (data.hasOwnProperty(key) && ~tableFieldsPut.indexOf(key)) {
                if (data.id) {
                    queryList.push({
                        query: "UPDATE " + tableNameProducts + " SET " + key + " = ? WHERE id = ?",
                        params: [data[key], data.id]
                    });
                }

            }
        });

    }
    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});

    return null;
};

/**
 *
 * @param id
 * @returns {*}
 */
exports.delete = (id) => {
    if (id) {
        let queryList = [
            {query: "DELETE FROM " + tableNameProducts + " WHERE id = ?", params: [id]},
        ];
        return client.batch(queryList, {prepare: true});
    }

    return null;
};

//---------------------------------- TYPE CLIENT ------------------------------------------
/**
 * @param data
 * @returns {*}
 */
exports.getClientType = (data) => {
    if (data.id) {
        let query = "SELECT " + tableFieldsClientTypeGet.join(', ') + " FROM " + tableNameClientType + " WHERE id = ?";
        return client.execute(query, [data.id], {prepare: true});
    } else if (data.name) {
        let query = "SELECT " + tableFieldsClientTypeGet.join(', ') + " FROM " + tableNameClientType + " WHERE name = ? ALLOW FILTERING";
        return client.execute(query, [data.name], {prepare: true});
    } else {
        let query = "SELECT " + tableFieldsClientTypeGet.join(', ') + " FROM " + tableNameClientType;
        return client.execute(query, [], {prepare: true});
    }
};


//-------------------------------------------- DAYS ------------------------------------
/**
 *
 * @param productId
 * @returns {*}
 */
exports.getDays = (productId) => {
    if (productId) {
        let query = "SELECT " + tableFieldsDayGet.join(', ') + " FROM " + tableNameProductsDays + " WHERE product_id = ? ALLOW FILTERING";

        return client.execute(query, [productId], {prepare: true});
    }

    return null;
};


/**
 * @param data
 * @returns {*}
 */
exports.deleteDays = (data) => {
    let queryList = [];

    if (data.hasOwnProperty('days') && Array.isArray(data.days) && data.days.length > 0) {
        data.days.forEach((el, index) => {
            if (el.id) {
                queryList.push({
                    query: "DELETE FROM " + tableNameProductsDays + " WHERE id = ?",
                    params: [el.id]
                });
            }
        });
    }
    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});

    return null;
};

/**
 *
 * @param data
 * @returns {*}
 */
exports.updateDays = (data) => {
    let queryList = [];
    if (data.hasOwnProperty('days') && Array.isArray(data.days) && data.days.length > 0) {
        data.days.forEach((el, index) => {
            Object.keys(el).forEach((key, index, arrayOfKeys) => {
                if (el.hasOwnProperty(key) && ~tableFieldsDayPut.indexOf(key) && el.id) {
                    queryList.push({
                        query: "UPDATE " + tableNameProductsDays + " SET " + key + " = ? WHERE id = ?",
                        params: [el[key], el.id]
                    });

                }
            });
        });
    }

    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});

    return null;
};

//---------------------------------------- INTERVAL TIME ---------------------------------
/**
 * @param data
 * @returns {*}
 */
exports.deleteIntervalTime = (data) => {
    let queryList = [];

    if (data.hasOwnProperty('intervals') && Array.isArray(data.intervals) && data.intervals.length > 0) {
        data.intervals.forEach((el, index) => {
            if (el.id) {
                queryList.push({
                    query: "DELETE FROM " + tableNameProductsIntervalTime + " WHERE id = ?",
                    params: [el.id]
                });
            }
        });
    }

    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});

    return null;
};

/**
 * @param data
 * @returns {*}
 */
exports.createIntervalTime = (data) => {
    let queryList = [];

    if (data.hasOwnProperty('intervals') && Array.isArray(data.intervals) && data.intervals.length > 0) {
        data.intervals.forEach((el, index) => {
            if (el) {
                if (el.product_id) {
                    if (el.end === "24:00") {
                        el.end = "23:59"
                    }
                    let params = [
                        el.start,
                        el.end,
                        Number(el.value),
                        String(el.type),
                        el.product_id,
                        Number(el.number),
                    ];

                    queryList.push({
                        query: "INSERT INTO " + tableNameProductsIntervalTime + "(" + tableFieldsIntervalTimePost.join(', ') + ") VALUES (uuid(), ?, ?, ?, ?, ?, ?)",
                        params: params,
                    });
                }
            }
        });
    }
    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});


    return null;
};

/**
 *
 * @param productId
 * @returns {*}
 */
exports.getIntervalTime = (productId) => {
    let query = "SELECT " + tableFieldsIntervalTimeGet.join(', ') + " FROM " + tableNameProductsIntervalTime + " WHERE product_id = ? ALLOW FILTERING";

    return client.execute(query, [productId], {prepare: true});
};


//-------------------------- PAYMENTS METHODS --------------------------------------
exports.createPaymentMethods = (data) => {
    let queryList = [];

    if (data.hasOwnProperty('payment_methods') && Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
        data.payment_methods.forEach((el, index) => {
            if (el.product_id) {
                let params = [
                    el.product_id,
                    String(el.name),
                    Number(el.checked),
                    Number(el.percent),
                ];

                queryList.push({
                    query: "INSERT INTO " + tableNameProductsPaymentMethods + "(" + tableFieldsPaymentMethodsPost.join(', ') + ") VALUES (uuid(), ?, ?, ?, ?)",
                    params: params,
                });
            }
        });
    }
    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});


    return null;
};

exports.deletePaymentMethods = (data) => {
    let queryList = [];

    if (data.hasOwnProperty('payment_methods') && Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
        data.payment_methods.forEach((el, index) => {
            if (el.id) {
                queryList.push({
                    query: "DELETE FROM " + tableNameProductsPaymentMethods + " WHERE id = ?",
                    params: [el.id]
                });
            }
        });
    }

    if (queryList.length > 0)
        return client.batch(queryList, {prepare: true});

    return null;
};

/**
 *
 * @param productId
 * @returns {*}
 */
exports.getPaymentMethods = (productId) => {
    let query = "SELECT " + tableFieldsPaymentMethodsGet.join(', ') + " FROM " + tableNameProductsPaymentMethods + " WHERE product_id = ? ALLOW FILTERING";

    return client.execute(query, [productId], {prepare: true});
};