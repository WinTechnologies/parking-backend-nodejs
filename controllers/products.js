var modelProducts = require('../models/products');

const checkTimeInterval = async (req) => {
    let _siteId = req.body.site_id;

    let _productsBySiteId = (await modelProducts.get({"site_id": _siteId}));

    let local_intervals = [];

    if ((typeof _productsBySiteId === 'object') && _productsBySiteId.hasOwnProperty('rows') && (Array.isArray(_productsBySiteId.rows)) && _productsBySiteId.rows.length > 0) {
        for (let i in _productsBySiteId.rows) {
            _productsBySiteId.rows[i].days = (await modelProducts.getDays(_productsBySiteId.rows[i].id)).rows;
            let local_days = [];
            for (let j = 0; j < _productsBySiteId.rows[i].days.length; j++) {
                if (_productsBySiteId.rows[i].days[j].checked) local_days.push(_productsBySiteId.rows[i].days[j].name);
            }

            let local_time_segments = _productsBySiteId.rows[i].time_segments.split(",");
            _productsBySiteId.rows[i].time_segments_arr = [];
            let local_start = "";
            for (let k = 0; k < local_time_segments.length; k++) {
                if (local_time_segments[k + 1] !== undefined && parseInt(local_time_segments[k].split(":")[0]) + 1 === parseInt(local_time_segments[k + 1].split(":")[0])) {
                    if (local_start === "") {
                        local_start = local_time_segments[k];
                    }
                } else {
                    local_intervals.push({
                        start: (local_start === "") ? local_time_segments[k] : local_start,
                        end: ("0" + (parseInt(local_time_segments[k].split(":")[0]) + 1)).slice(-2) + ":" + local_time_segments[k].split(":")[1],
                        begin_date: _productsBySiteId.rows[i].begin_date,
                        end_date: _productsBySiteId.rows[i].end_date,
                        days: local_days,
                        id: _productsBySiteId.rows[i].id,
                        client_type: _productsBySiteId.rows[i].client_type
                    });
                    local_start = "";
                }
            }
        }
    }

    req.body.time_segments_arr = [];
    if (Array.isArray(req.body.intervals) && req.body.intervals.length > 0) {
        req.body.intervals.forEach((el, index) => {
            req.body.time_segments_arr.push({
                start: el.start.toString().slice(0, 5),
                end: el.end.toString().slice(0, 5)
            });
        })
    } else {
        let local_time_segments_arr = req.body.time_segments.split(",");
        let local_start = "";
        for (let k = 0; k < local_time_segments_arr.length; k++) {
            if (local_time_segments_arr[k + 1] !== undefined && parseInt(local_time_segments_arr[k].split(":")[0]) + 1 === parseInt(local_time_segments_arr[k + 1].split(":")[0])) {
                if (local_start === "") {
                    local_start = local_time_segments_arr[k];
                }
            } else {
                req.body.time_segments_arr.push({
                    start: (local_start === "") ? local_time_segments_arr[k] : local_start,
                    end: ("0" + (parseInt(local_time_segments_arr[k].split(":")[0]) + 1)).slice(-2) + ":" + local_time_segments_arr[k].split(":")[1]
                });
                local_start = "";
            }
        }
    }

    if (req.body.begin_date && req.body.end_date) {
        for (let j = 0; j < local_intervals.length; j++) {
            if (req.body.id && local_intervals[j].id && req.body.id.toString() === local_intervals[j].id.toString()) continue;
            if (req.body.client_type && local_intervals[j].client_type && req.body.client_type !== local_intervals[j].client_type) continue;
            if (new Date(req.body.end_date).getTime() > new Date(local_intervals[j].begin_date).getTime() && new Date(req.body.begin_date).getTime() < new Date(local_intervals[j].end_date).getTime()) {
                for (let i = 0; i < req.body.days.length; i++) {
                    if (local_intervals[j].days.indexOf(req.body.days[i].name) > -1 && req.body.days[i].checked) {
                        for (let iterator in req.body.time_segments_arr) {
                            if (local_intervals[j].start < req.body.time_segments_arr[iterator].end && local_intervals[j].end > req.body.time_segments_arr[iterator].start) {
                                req.error = "error time intervals";
                            }
                        }
                    }
                }
            }
        }
    }
};

const checkStatus = async (req) => {
    if (req.body.id) {
        let _id = req.body.id;
        let _product = (await modelProducts.get({"id": _id}));
        if ((typeof _product === 'object') && _product.hasOwnProperty('rows') && (Array.isArray(_product.rows)) && _product.rows.length > 0) {
            if (_product.rows[0].status !== req.body.status) {
                if (req._user.usertype === 'Superadmin') {
                    if (!(_product.rows[0].status === 'validated' && (req.body.status === 'active' || req.body.status === 'not active'))) {
                        req.error = 'error not allowed status';
                    }
                } else if (req._user.usertype === 'Admin') {
                    if (!(_product.rows[0].status === 'not active' && req.body.status === 'validated')) {
                        req.error = 'error not allowed status';
                    }
                } else {
                    if (!(req.body.status === 'not active')) {
                        req.error = 'error not allowed status';
                    }
                }
            }
        }
    } else {
        if (req._user.usertype === 'Superadmin') {
            if (!(req.body.status === 'not active')) {
                req.error = 'error not allowed status';
            }
        } else if (req._user.usertype === 'Admin') {
            if (!(req.body.status === 'validated')) {
                req.error = 'error not allowed status';
            }
        } else {
            if (!(req.body.status === 'not active')) {
                req.error = 'error not allowed status';
            }
        }
    }
};

const getTimeIntervalsBySiteId = async (req, res, next) => {
    try {
        let response = [];
        let _productsBySiteId = (await modelProducts.get({"site_id": req.query.site_id}));
        if (_productsBySiteId && (typeof _productsBySiteId === 'object') && _productsBySiteId.hasOwnProperty('rows') && (Array.isArray(_productsBySiteId.rows)) && _productsBySiteId.rows.length > 0) {
            for (let i in _productsBySiteId.rows) {
                let _productDays = (await modelProducts.getDays(_productsBySiteId.rows[i].id));
                let local_days = [];
                if ((typeof _productDays === 'object') && _productDays.hasOwnProperty('rows') && Array.isArray(_productDays.rows) && _productDays.rows.length > 0) {
                    _productDays.rows.sort(function (a, b) {
                        return (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0);
                    });
                    _productDays.rows.forEach((el, index) => {
                        if (el.checked) local_days.push(el.name);
                    })
                }
                let local_time_segments = _productsBySiteId.rows[i].time_segments.split(",");
                _productsBySiteId.rows[i].time_segments_arr = [];
                let local_start = "";
                for (let k = 0; k < local_time_segments.length; k++) {
                    if (local_time_segments[k + 1] !== undefined && parseInt(local_time_segments[k].split(":")[0]) + 1 === parseInt(local_time_segments[k + 1].split(":")[0])) {
                        if (local_start === "") {
                            local_start = local_time_segments[k];
                        }
                    } else {
                        response.push({
                            start: (local_start === "") ? local_time_segments[k] : local_start,
                            end: ("0" + (parseInt(local_time_segments[k].split(":")[0]) + 1)).slice(-2) + ":" + local_time_segments[k].split(":")[1],
                            begin_date: _productsBySiteId.rows[i].begin_date,
                            end_date: _productsBySiteId.rows[i].end_date,
                            days: local_days,
                            id: _productsBySiteId.rows[i].id,
                            client_type: _productsBySiteId.rows[i].client_type,
                            name: _productsBySiteId.rows[i].name
                        });
                        local_start = "";
                    }
                }
            }
        }
        return res.status(201).json(response);
    } catch (e) {
        next(e);
    }
};
exports.getTimeIntervalsBySiteId = getTimeIntervalsBySiteId;

const create = async (req, res, next) => {
    try {
        (await checkStatus(req));
        (await checkTimeInterval(req));
        if ( req.error ){
            return res.status(202).json({'error': req.error});
        }
        let response = (await modelProducts.create(req.body));
        if (response === null)
            return res.status(202).json({'message': 'empty query list'});

        return res.status(201).json(response.rows);
    } catch (e) {
        return next(e);
    }
};

const get = async (req, res, next) => {
    try {
        let response = (await modelProducts.get(req.query));

        if (response === null)
            return res.status(202).json({'message': 'empty query list'});

        if (response.hasOwnProperty('rows') && Array.isArray(response.rows) && response.rows.length > 0) {
            response.rows.sort(function (pr1, pr2) {
                return (pr1.time_created > pr2.time_created)
                    ? -1
                    : (
                        pr1.time_created < pr2.time_created
                            ? 1
                            : 0
                    )
            });
            let productList = response.rows;
            for (let i in productList) {
                productList[i].days = (await modelProducts.getDays(productList[i].id)).rows;
                productList[i].interval_time = (await modelProducts.getIntervalTime(productList[i].id)).rows;
                productList[i].interval_time.forEach((el, index) => {
                    if ( el.end.toString().slice(0, 5) === "23:59" ) el.end = "24:00";
                });
                productList[i].payment_methods = (await modelProducts.getPaymentMethods(productList[i].id)).rows;
            }
        }

        return res.status(200).json(response.rows);
    } catch (e) {
        return next(e);
    }
};

const update = async (req, res, next) => {
    try {
        (await checkStatus(req));
        (await checkTimeInterval(req));
        if ( req.error ){
            return res.status(202).json({'error': req.error});
        }
        let response = (await modelProducts.update(req.body));
        (await modelProducts.updateDays(req.body));

        let listInterval = (await modelProducts.getIntervalTime(req.body.id));

        if (listInterval && listInterval.hasOwnProperty('rows') && Array.isArray(listInterval.rows) && listInterval.rows.length > 0)
            (await modelProducts.deleteIntervalTime({intervals: listInterval.rows}));

        (await modelProducts.createIntervalTime(req.body));

        let listPaymentMethods = (await modelProducts.getPaymentMethods(req.body.id));

        if (listPaymentMethods && listPaymentMethods.hasOwnProperty('rows') && Array.isArray(listPaymentMethods.rows) && listPaymentMethods.rows.length > 0)
            (await modelProducts.deletePaymentMethods({payment_methods: listPaymentMethods.rows}));

        (await modelProducts.createPaymentMethods(req.body));

        if (response === null)
            return res.status(202).json({'message': 'empty query list'});

        return res.status(202).json(response.rows);
    } catch (e) {
        return next(e);
    }
};

const del = async (req, res, next) => {
    try {
        let checkExist = (await modelProducts.get(req.body.id));
        if (checkExist && checkExist.rowLength > 0) {
            try {
                let dayList = (await modelProducts.getDays(req.body.id));
                if (dayList && dayList.hasOwnProperty('rows') && dayList.rows.length > 0) {
                    let dayListId = [];
                    dayList.rows.forEach((el, index) => {
                        dayListId.push(el.id);
                    });
                    if (dayListId.length > 0)
                        (await  modelProducts.deleteDays({"days": dayListId}));
                }

                let intervalTimeList = (await modelProducts.getIntervalTime(req.body.id));
                if (intervalTimeList && intervalTimeList.hasOwnProperty('rows') && intervalTimeList.rows.length > 0) {
                    let intervalTimeListId = [];
                    intervalTimeList.rows.forEach((el, index) => {
                        intervalTimeListId.push(el.id);
                    });

                    if (intervalTimeListId.length > 0)
                        (await  modelProducts.deleteIntervalTime({"intervals": intervalTimeListId}));
                }

                await modelProducts.delete(req.body.id);
                return res.status(202).json({message: 'deleted'});
            } catch (e) {
                return next(e);
            }
        } else {
            return res.status(202).json({error: 'Invalid data.'});
        }
    } catch (e) {
        return next(e);
    }
};


exports.create = create;
exports.get = get;
exports.update = update;
exports.del = del;

const getClientType = async (req, res, next) => {
    try {
        let response = (await modelProducts.getClientType(req.query));
        return res.status(200).json(response.rows);
    } catch (e) {
        return next(e);
    }
};

exports.getClientType = getClientType;


const getDays = async (req, res, next) => {
    try {
        let response = (await modelProducts.getDays(req.query.id));
        return res.status(200).json(response.rows);
    } catch (e) {
        return next(e);
    }
};

const updateDays = async (req, res, next) => {
    try {
        let response = (await modelProducts.updateDays(req.body));
        if (response === null)
            return res.status(202).json({'message': 'empty query list'});

        return res.status(202).json(response.rows);
    } catch (e) {
        return next(e);
    }
};

const delDays = async (req, res, next) => {
    try {
        await modelProducts.deleteDays(req.body);
        return res.status(202).json({message: 'deleted'});
    } catch (e) {
        return next(e);
    }
};

exports.getDays = getDays;
exports.delDays = delDays;
exports.updateDays = updateDays;


const getIntervalTime = async (req, res, next) => {
    try {
        let response = (await modelProducts.getIntervalTime(req.query.id));
        if (response === null)
            return res.status(202).json({'message': 'empty query list'});

        return res.status(200).json(response.rows);
    } catch (e) {
        return next(e);
    }
};


const createIntervalTime = async (req, res, next) => {
    try {
        if (req.body.id) {
            let intervalTimeList = (await modelProducts.getIntervalTime(req.body.id));
            if (intervalTimeList) {
                let intervalTimeListId = [];
                intervalTimeList.forEach((el, index) => {
                    intervalTimeListId.push(el.id);
                });

                if (intervalTimeListId.length > 0)
                    (await  modelProducts.deleteIntervalTime({"intervals": intervalTimeListId}));
            }
        }

        let response = (await modelProducts.createIntervalTime(req.body));
        if (response === null)
            return res.status(202).json({'message': 'empty query list'});

        return res.status(201).json(response.rows);
    } catch (e) {
        return next(e);
    }
};
const delIntervalTime = async (req, res, next) => {
    try {
        await modelProducts.deleteIntervalTime(req.body);
        return res.status(202).json({message: 'deleted'});
    } catch (e) {
        return next(e);
    }
};


const getCalendarBySiteId = async (req, res, next) => {
    try {
        if (req.query.site_id === undefined || req.query.start === undefined || req.query.end === undefined || req.query.client_type === undefined) {
            return res.status(400).json("error need site_id, start, end, client_type");
        }

        let response = [];
        let dateFrom = new Date(req.query.start);
        let dateTo = new Date(req.query.end);

        if (dateFrom.getTime() > dateTo.getTime()) {
            return res.status(400).json("error start is longer than end");
        } else if (dateTo.getTime() - dateFrom.getTime() > 15552000000) {
            return res.status(400).json("error max range 180 days");
        } else {

            let _productsBySiteId = (await modelProducts.getForCalendar({
                "site_id": req.query.site_id,
                "client_type": req.query.client_type,
                "start": dateFrom.toISOString(),
                "end": dateTo.toISOString()
            }));
            if (_productsBySiteId && (typeof _productsBySiteId === 'object') && _productsBySiteId.hasOwnProperty('rows') && (Array.isArray(_productsBySiteId.rows)) && _productsBySiteId.rows.length > 0) {
                for (let i in _productsBySiteId.rows) {
                    _productsBySiteId.rows[i].payment_types = (await modelProducts.getPaymentMethods(_productsBySiteId.rows[i].id)).rows;
                    for (let j in _productsBySiteId.rows[i].payment_types) {
                        _productsBySiteId.rows[i].payment_types[j] = {
                            name: _productsBySiteId.rows[i].payment_types[j].name,
                            checked: _productsBySiteId.rows[i].payment_types[j].checked,
                            percent: _productsBySiteId.rows[i].payment_types[j].percent
                        }
                    }
                    _productsBySiteId.rows[i].interval_time = (await modelProducts.getIntervalTime(_productsBySiteId.rows[i].id)).rows;
                    for (let j in _productsBySiteId.rows[i].interval_time) {
                        _productsBySiteId.rows[i].interval_time[j] = {
                            start: _productsBySiteId.rows[i].interval_time[j].start.toString().slice(0, 5),
                            end: (_productsBySiteId.rows[i].interval_time[j].end.toString().slice(0, 5) === "23:59") ? "24:00" : _productsBySiteId.rows[i].interval_time[j].end.toString().slice(0, 5),
                            value: _productsBySiteId.rows[i].interval_time[j].value,
                            type: _productsBySiteId.rows[i].interval_time[j].type
                        }
                    }
                    _productsBySiteId.rows[i].interval_time.sort(function (a, b) {
                        return (a.start > b.start) ? 1 : ((b.start > a.start) ? -1 : 0);
                    });
                    _productsBySiteId.rows[i].days = (await modelProducts.getDays(_productsBySiteId.rows[i].id)).rows;
                    let local_time_segments = _productsBySiteId.rows[i].time_segments.split(",");
                    _productsBySiteId.rows[i].time_segments_arr = [];
                    let local_start = "";
                    for (let k = 0; k < local_time_segments.length; k++) {
                        if (local_time_segments[k + 1] !== undefined && parseInt(local_time_segments[k].split(":")[0]) + 1 === parseInt(local_time_segments[k + 1].split(":")[0])) {
                            if (local_start === "") {
                                local_start = local_time_segments[k];
                            }
                        } else {
                            _productsBySiteId.rows[i].time_segments_arr.push({
                                start: (local_start === "") ? local_time_segments[k] : local_start,
                                end: ("0" + (parseInt(local_time_segments[k].split(":")[0]) + 1)).slice(-2) + ":" + local_time_segments[k].split(":")[1]
                            });
                            local_start = "";
                        }
                    }
                }
            }

            let today = new Date(dateFrom);

            while (today.getTime() <= dateTo.getTime()) {
                let local_products = [];
                if (_productsBySiteId && (typeof _productsBySiteId === 'object') && _productsBySiteId.hasOwnProperty('rows') && (Array.isArray(_productsBySiteId.rows)) && _productsBySiteId.rows.length > 0) {
                    for (let i in _productsBySiteId.rows) {
                        let local_begin_date = new Date(_productsBySiteId.rows[i].begin_date);
                        let local_end_date = new Date(_productsBySiteId.rows[i].end_date);
                        if ((today.getTime() >= local_begin_date.getTime()) && (today.getTime() < local_end_date.getTime())) {
                            for (let j in _productsBySiteId.rows[i].days) {
                                if (_productsBySiteId.rows[i].days[j].checked === true && (
                                    (_productsBySiteId.rows[i].days[j].name === "Sunday" && today.getDay() === 0) ||
                                    (_productsBySiteId.rows[i].days[j].name === "Monday" && today.getDay() === 1) ||
                                    (_productsBySiteId.rows[i].days[j].name === "Tuesday" && today.getDay() === 2) ||
                                    (_productsBySiteId.rows[i].days[j].name === "Wednesday" && today.getDay() === 3) ||
                                    (_productsBySiteId.rows[i].days[j].name === "Thursday" && today.getDay() === 4) ||
                                    (_productsBySiteId.rows[i].days[j].name === "Friday" && today.getDay() === 5) ||
                                    (_productsBySiteId.rows[i].days[j].name === "Saturday" && today.getDay() === 6)
                                )
                                ) {

                                    for (let k = 0; k < _productsBySiteId.rows[i].time_segments_arr.length; k++) {
                                        local_products.push({
                                            id: _productsBySiteId.rows[i].id,
                                            time_unit: _productsBySiteId.rows[i].time_unit,
                                            price_type: _productsBySiteId.rows[i].price_type,
                                            payment_types: _productsBySiteId.rows[i].payment_types,
                                            interval_time: _productsBySiteId.rows[i].interval_time,
                                            price_per_time_unit: _productsBySiteId.rows[i].price_per_time_unit,
                                            initial_time_unit_price: _productsBySiteId.rows[i].initial_time_unit_price,
                                            price: _productsBySiteId.rows[i].price,
                                            fixed_price: _productsBySiteId.rows[i].fixed_price,
                                            first_interval: _productsBySiteId.rows[i].time_segments_arr[k].start,
                                            last_interval: _productsBySiteId.rows[i].time_segments_arr[k].end
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                response.push({
                    date: today.toISOString(),
                    products: local_products
                });
                today.setDate(today.getDate() + 1);
            }
        }
        return res.status(200).json(response);
    } catch (e) {
        next(e);
    }
};
exports.getCalendarBySiteId = getCalendarBySiteId;

exports.getIntervalTime = getIntervalTime;
exports.createIntervalTime = createIntervalTime;
exports.delIntervalTime = delIntervalTime;