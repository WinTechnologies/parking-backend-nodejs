const model = require('./tariff_segment.model');
const modelInterval = require('../tariff_interval/tariff_interval.model');
const modelProject = require('../projects/projects.model');

const moment = require('moment');
const middleware = require("./tariff_segment.middleware");
const StreetType = middleware.StreetType;

exports.create = async (req, res, next) => {
    try {
        const intervals = req.body.intervals;
        delete req.body.intervals;
        const result = await model.create(req.body, req._user.employee_id);
        if (result && result.rows && result.rows.length) {
            const promises = [];
            intervals.forEach(interval => {
                promises.push(modelInterval.create({...interval, segment_id: result.rows[0].id}));
            });
            await Promise.all(promises);
            return res.status(201).json({message: 'created.', segment: result.rows[0]});
        } else {
            return res.status(400).json({message: err.message});
        }

    } catch (err) {
        return res.status(400).json({message: err.message});
    }
};

exports.getAll = async (req, res, next) => {
    try {
        const result = await model.getAll(req.query);
        if (result.rowCount > 0) {
            const segments = result.rows;
            for (let i = 0; i < segments.length; i++) {
                const intervalResult = await modelInterval.getAll({segment_id: segments[i].id});
                segments[i]['intervals'] = intervalResult.rows;
            }
            return res.status(200).json(segments);
        } else {
            return res.status(200).json([]);
        }
    } catch (err) {
        return res.status(400).json({message: err.message});
    }
};

exports.getOverview = async (req, res, next) => {
    try {
        const fromDate = moment(req.query.from, 'YYYY-MM-DD');
        const toDate = moment(req.query.to, 'YYYY-MM-DD');

        const validTariffSegmentsResult = await model.getValidSegment(req.query);
        const validTariffSegments = validTariffSegmentsResult.rows;
        if (!validTariffSegments.length) {
            return res.status(200).json(null);
        }

        const timePeriodResult = {};
        const dayOfWeek = {'sun': 7, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6};
        const startOfDay = moment('00:00', 'HH:mm');
        const endOfDay = moment('24:00', 'HH:mm');

        for (let i = 0; i < validTariffSegments.length; i++) {
            const currTariffSegment = validTariffSegments[i];
            const intervalsResult = await modelInterval.getAll({segment_id: currTariffSegment.id});
            if (intervalsResult.rows && intervalsResult.rows.length) {
                currTariffSegment['intervals'] = intervalsResult.rows;
            }
            const appDays = currTariffSegment.applicable_days.split(',').map(currElement => dayOfWeek[currElement]);
            const segmentFromDate = moment(currTariffSegment.date_start, 'YYYY-MM-DD');
            const segmentToDate = moment(currTariffSegment.date_end, 'YYYY-MM-DD');

            for (const m = moment(segmentFromDate); m.diff(segmentToDate, 'days') <= 0; m.add(1, 'days')) {
                if (m.isBefore(fromDate) || m.isAfter(toDate)) continue;
                const currDay = m.format('YYYY-MM-DD');
                if (!timePeriodResult[currDay]) timePeriodResult[currDay] = [];
                // Segment applicable hours
                let s = moment(currTariffSegment.time_start, 'HH:mm');
                let e = moment(currTariffSegment.time_end, 'HH:mm');

                const timePeriodItem = {
                    start: s,
                    end: e,
                    intervals: currTariffSegment.intervals,
                    type_tariff: currTariffSegment.type_tariff,
                    id: currTariffSegment.id
                };

                // Segment applicable days
                if (appDays.includes(m.isoWeekday())) {
                    if (e.isAfter(s)) {
                        timePeriodResult[currDay].push(timePeriodItem);

                    } else if (s.isSame(e)) { // whole day
                        timePeriodItem.start = startOfDay;
                        timePeriodItem.end = endOfDay;
                        timePeriodResult[currDay].push(timePeriodItem);

                    } else { // Midnight crossing
                        const timePeriodItem1 = {...timePeriodItem, start: startOfDay};
                        const timePeriodItem2 = {...timePeriodItem, end: endOfDay};
                        timePeriodResult[currDay].push(timePeriodItem1);
                        timePeriodResult[currDay].push(timePeriodItem2);
                    }
                }
            }
        }

        for (const m = moment(fromDate); m.diff(toDate, 'days') <= 0; m.add(1, 'days')) {
            const currDay = m.format('YYYY-MM-DD');
            if (!timePeriodResult[currDay]) {
                timePeriodResult[currDay] = [];
            } else {
                timePeriodResult[currDay].sort((a, b) => a.start.diff(b.start, 'minutes'));
            }
            timePeriodResult[currDay] = timePeriodResult[currDay].map(item => ({
                ...item,
                start: item.start.format('HH:mm'),
                end: item.end.format('HH:mm'),
            }));
        }
        return res.status(200).json(timePeriodResult);
    } catch (e) {
        return res.status(400).json({message: e.message});
    }
};

const mergePeriods = (periodList) => {
    // periodList = [{start, end} ...]
    let periods = [...periodList];
    periods = periods.sort(function (a, b) { return a.start < b.start ? -1 : 1 });

    if (1 < periods.length) {
        const res = [periods[0]];
        for (var j = 1; j < periods.length; j++) {
            const lastPeriod = res[res.length - 1];
            const currPeriod = periods[j];

            if (lastPeriod.end.diff(currPeriod.start, 'minutes') === 0) {
                res[res.length - 1] = { start: lastPeriod.start, end: currPeriod.end };
            } else {
                res.push(currPeriod);
            }
        }
        return res;
    } else {
        return periods;
    }
};

const getTariffPeriod = (validTariffSegment, from, to) => {
    try {
        const fromDate = moment(from.format('YYYY-MM-DD')).add(-1, 'days'); // Start Day
        const toDate = moment(to.format('YYYY-MM-DD')); // End Day
        const timePeriodResult = {};
        const dayOfWeek = {'sun': 7, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6};

        for (let i = 0; i < validTariffSegment.length; i++) {
            const currTariffSegment = validTariffSegment[i];
            const appDays = currTariffSegment.applicable_days.split(',').map(function (currElement, index) { return dayOfWeek[currElement]; });

            const time_start = moment(currTariffSegment.time_start, "HH:mm:ss");
            const time_end = moment(currTariffSegment.time_end, "HH:mm:ss");

            const validityStart = moment(currTariffSegment.date_start).set({ hour: time_start.get('hour'), minute: time_start.get('minute'), second: time_start.get('second') });
            const validityEnd = moment(currTariffSegment.date_end).set({ hour: time_end.get('hour'), minute: time_end.get('minute'), second: time_end.get('second') });

            const currTimePeriods = [];
            for (let m = moment(fromDate); m.diff(toDate, 'days') <= 0; m.add(1, 'days')) {
                // Segment applicable hours
                let s = moment(m.format('YYYY-MM-DD') + ' ' + currTariffSegment.time_start, 'YYYY-MM-DD HH:mm:ss');
                let e = moment(m.format('YYYY-MM-DD') + ' ' + currTariffSegment.time_end, 'YYYY-MM-DD HH:mm:ss');

                // Segment applicable days
                if (s < e) {
                    if (!appDays.includes(s.isoWeekday())) {
                        continue;
                    }
                } else { // Midnight crossing
                    e = e.add(1, 'days');
                    if (!appDays.includes(s.isoWeekday())) {
                        s = moment(e.format('YYYY-MM-DD') + ' 00:00', 'YYYY-MM-DD HH:mm')
                    }
                    if (!appDays.includes(e.isoWeekday())) {
                        e = moment(e.format('YYYY-MM-DD') + ' 00:00', 'YYYY-MM-DD HH:mm')
                    }
                    if (s.diff(e, 'minutes') === 0) {
                        continue;
                    }
                }

                // Discard out of bound segment
                if (((s < from) && (e < from)) || ((to < s) && (to < e))) {
                    continue;
                }

                // Adjust upper and lower segment bound to input parking start time and end time
                let currPeriod;
                if ((s <= from) && (to <= e)) { // start and end included
                    currPeriod = { start: from, end: to };
                } else if ((s <= from) && (e <= to)) { // start included
                    currPeriod = { start: from, end: e };
                } else if ((s <= to) && (to <= e)) { // end included
                    currPeriod = { start: s, end: to };
                } else { // all covered
                    currPeriod = { start: s, end: e };
                }

                // Ensure tariff segment validity && period start < end
                if ((validityStart <= currPeriod.start) && (currPeriod.end <= validityEnd) && (0 < currPeriod.end.diff(currPeriod.start, 'minutes'))) {
                    currTimePeriods.push(currPeriod);
                }
            }

            // Merge consecutives periods
            let currRes = [];
            const intervalStartTime = currTariffSegment["intervals"]
                .filter((currElement, index) => { return currElement.time_start === '24:00' });
            let mergedPeriods;
            if (currTariffSegment["time_handling"] !== 'GTS'
                || (currTariffSegment["time_handling"] === 'GTS' && 0 < intervalStartTime.length) ) {
                mergedPeriods = mergePeriods(currTimePeriods);
            } else {
                mergedPeriods = currTimePeriods;
            }

            // Associate tariff interval to timePeriod
            const today = moment().set({ hour:0, minute:0, second:0, millisecond:0 });
            for (let l = 0; l < mergedPeriods.length; l++) {
                if ((currTariffSegment.type_tariff === 'Custom') && (currTariffSegment.time_handling === 'GTS')) {
                    const duration = mergedPeriods[l].end.diff(mergedPeriods[l].start, 'minutes') / currTariffSegment.time_step_custom;
                    let intervals = currTariffSegment.intervals;
                    for (let key in intervals) {
                        const tempElement = intervals[key];
                        tempElement.minDuration = moment(tempElement.time_start, "HH:mm:ss").diff(today, 'minutes') / currTariffSegment.time_step_custom;
                        intervals[key] = tempElement;
                    }
                    intervals = intervals.filter(function (currElement, index) { return currElement.minDuration <= duration });
                    intervals = intervals.sort(function (a, b) { return a.minDuration < b.minDuration ? -1 : 1 });

                    mergedPeriods[l].interval = intervals[intervals.length-1];
                } else {
                    mergedPeriods[l].interval = currTariffSegment.intervals[0];
                }
            }
            timePeriodResult[currTariffSegment.id] = mergedPeriods;
        }
        return timePeriodResult;
    } catch(e) {
        return {};
    }
};

const calculatePriceByInterval = (tariffInterval) => {
    let price = 0;

    const startTime = moment(tariffInterval.start);
    const endTime = moment(tariffInterval.end);

    const interval = tariffInterval.interval;
    const minutes = endTime.diff(startTime, 'minutes');

    switch (interval.type_tariff) {
        case 'Absolute':
            price = interval.price_init;
            break;
        case 'Fixed Rate':
            price = interval.price_init + Math.ceil(minutes / interval.time_step ) * interval.price;
            break;
        case 'Ladder':
            const N = Math.ceil(minutes / interval.time_step );
            const price_list = Array.apply(null, Array(N)).map(function (e, i) { return interval.price * Math.pow(interval.rate_growth, i); });
            price = interval.price_init + price_list.reduce(function(a, b) { return a + b; }, 0);
            break;
    }

    return Math.round(price * 100)/100;
};

exports.calculatePrice = async (req, res, next) => {
    try {
        // Input request validation
        const requiredFields = middleware.checkRequiredFields(req.query);
        if (requiredFields.length > 0) { return res.status(400).json({ message: "missing fields: " + requiredFields.join(', ') }); }

        const fromDateTime = moment(req.query.start_date + ' ' + req.query.start_time, 'YYYY-MM-DD HH:mm');
        const toDateTime = moment(req.query.end_date + ' ' + req.query.end_time, 'YYYY-MM-DD HH:mm');

        if (!fromDateTime.isValid() || !toDateTime.isValid()) { return res.status(400).json({ message: 'invalid start and end date'}); }

        // Fetch project info TODO: replace another model func instead of getAllProjectsOfConnectedUser
        let fetchedProject = await modelProject.getProjectById(req.query.project_id);
        if (fetchedProject.rows.length === 0) { return res.status(400).json({message: 'project not found'}); }
        const currency = fetchedProject.rows[0].currency_code;

        // Prepare tariff segment DB query
        const fromDate = fromDateTime.format('YYYY-MM-DD');
        const toDate = toDateTime.format('YYYY-MM-DD');
        const query = {
            type_client: req.query.type_client,
            from: fromDate,
            to: toDate,
            is_onstreet: req.query.street_type === StreetType.OnStreet
        };
        if (query.is_onstreet) {
            query.parking_id = req.query.parking_id;
        } else {
            query.carpark_zone_id = req.query.carpark_zone_id;
        }

        // Fetch applicable tariff segments
        const fetchedSegmentResult = await model.getValidSegment(query);
        const fetchedSegment = fetchedSegmentResult.rows;

        let segmentList = [];
        if (fetchedSegment.length) {
            // get tariff intervals for all tariff segments
            for (let i = 0; i < fetchedSegment.length; i++) {
                let segment = fetchedSegment[i];
                const result_interval = await modelInterval.getAll({ segment_id: segment.id });
                if (result_interval.rows && result_interval.rows.length) {
                    segment['intervals'] = result_interval.rows;
                }

                // Flatten custom tariff segment with TOD time handling
                if (segment.time_handling === 'TOD') {
                    const flatSegment = [];
                    for (let v = 0; v < segment.intervals.length; v++) {
                        const currSegment = Object.assign({}, segment);
                        const currTimeInterval = segment.intervals[v];

                        currSegment.time_start = currTimeInterval.time_start;
                        currSegment.time_end = currTimeInterval.time_end;
                        currSegment.intervals = [currTimeInterval];
                        currSegment.id = currSegment.id + '-' + currTimeInterval.id;
                        flatSegment.push(currSegment);
                    }
                    segmentList = segmentList.concat(flatSegment);
                } else {
                    segmentList.push(segment);
                }
            }
        } else {
            return res.status(400).json({ message: "No applicable tariff defined" });
        }

        // Determine periods on which tariff segments will apply
        const timePeriods = getTariffPeriod(segmentList, fromDateTime, toDateTime);

        // Apply tariff on each periods
        const result = {};
        let totalPrice = 0;
        for (const key in timePeriods) {
            const currPeriods = timePeriods[key];
            const currRes = [];
            let currTotalPrice = 0;
            for (let j = 0; j < currPeriods.length; j++) {
                const currPrice = calculatePriceByInterval(currPeriods[j]);
                currRes.push({ start: currPeriods[j].start, end: currPeriods[j].end, price: currPrice });
                currTotalPrice += currPrice;
                totalPrice += currPrice;
            }
            result[key] = { intervalPrice: currTotalPrice, periods: currRes };
        }
        return res.status(200).json({ start: fromDateTime, end: toDateTime, totalPrice: totalPrice, currency: currency, segments: result });
    } catch(e) {
        return res.status(400).json({ message: "Incorrect input request" });
    }
};

exports.update = async (req, res, next) => {
    const id = req.params.id;
    try {
        const segment = await model.getAll({ id });
        if (!segment.rows.length) {
            return res.status(400).json({error: 'Invalid data.'});
        }

        const intervals = req.body.intervals;

        await model.update(id, req.body);
        await modelInterval.deleteBySegmentId(id);

        const promises = [];
        intervals.forEach(interval => {
            promises.push(modelInterval.create({...interval, segment_id: id}));
        });
        await Promise.all(promises);

        return res.status(202).json({message: 'updated.'});
    } catch (e) {
        return res.status(400).json({message: e.message});
    }
};

exports.del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        try {
            const result = await model.getAll({ id });
            if (result && result.rows && result.rows[0]) {
                await model.delete(id, req._user.employee_id);
                await modelInterval.deleteBySegmentId(id);
                return res.status(200).json({message: 'deleted.'});
            } else {
                return res.status(400).json({error: 'Invalid data.'});
            }
        } catch (e) {
            return res.status(400).json({message: e.message});
        }
    }
};
