const model = require('./performance.model');
const {parseDate, format} = require('../../../helpers/date');

exports.getChartStatisticByEmployeeId = async (req, res, next) => {
    const {employee_id = null} = req.params;
    const {project_id = null} = req.query;

    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    if (Number.isNaN(from) || Number.isNaN(to)) {
        return res.status(400).json({message: 'invalid date'});
    }

    try {
        const [
            totalTimeAndDistance,
            CNInterval,
            CNCnt,
            CNCntRanking,
            wpCovering,
            distrOfWorkTimeByStatus,
            distrOfWorkTimeByDistance,
            CNCntByStatus,
            CNCntByViolation,
            violationCntByViolationType,
            violationCntByPlateType,
            jobCntByTriggered,
            jobCntByType,
            violationCntByStreet,
            walkingDistancePerDay,
            minutesForObservation,
        ] = await Promise.all([
            model.getTotalTimeAndDistance({employee_id, project_id, from, to}),
            model.getCNInterval({employee_id, project_id, from, to}),
            model.getCNCnt({employee_id, project_id, from, to}),
            model.getCNCntRanking({employee_id, project_id, from, to}),
            model.getWpCovering({employee_id, project_id, from, to}),
            model.getDistrOfWorkTimeByStatus({employee_id, project_id, from, to}),
            model.getDistrOfWorkTimeByDistance({employee_id, project_id, from, to}),
            model.getCNCntByStatus({employee_id, project_id, from, to}),
            model.getCNCntByViolation({employee_id, project_id, from, to}),
            model.getViolationCntByViolationType({employee_id, project_id, from, to}),
            model.getViolationCntByPlateType({employee_id, project_id, from, to}),
            model.getJobCntByTriggered({employee_id, project_id, from, to}),
            model.getJobCntByType({employee_id, project_id, from, to}),
            model.getViolationCntByStreet({employee_id, project_id, from, to}),
            model.getWalkingDistancePerDay({employee_id, project_id, from, to}),
            model.getMinutesForObservation({employee_id, project_id, from, to}),
        ]);

        const totalTimeSeconds = Number.parseFloat(totalTimeAndDistance.rows[0].total_time_seconds);
        const totalDistanceKm = Number.parseFloat(totalTimeAndDistance.rows[0].total_distance_kilometers);

        let mediumSpeedKmPerHour = null;
        if (totalTimeSeconds !== null && totalDistanceKm !== null) {
            mediumSpeedKmPerHour = 0;
            if (totalTimeSeconds > 0) {
                mediumSpeedKmPerHour = totalDistanceKm / totalTimeSeconds * 3600;
            }
        }

        const convertToFixed = (v, n = 3) => {
            return v !== null ? Number.parseFloat(v.toFixed(n)) : null
        }

        const responseData = {
            total_time_seconds: convertToFixed(totalTimeSeconds),
            total_distance_km: convertToFixed(totalDistanceKm),
            medium_speed_km_per_hour: convertToFixed(mediumSpeedKmPerHour),
            longest_cn_interval_seconds: convertToFixed(Number.parseFloat(CNInterval.rows[0].longest_time_seconds)),
            fastest_cn_interval_seconds: convertToFixed(Number.parseFloat(CNInterval.rows[0].fastest_time_seconds)),
            cn_cnt: Number.parseInt(CNCnt.rows[0].count),
            cn_cnt_max: Number.parseInt(CNCnt.rows[0].max),
            cn_cnt_min: Number.parseInt(CNCnt.rows[0].min),
            cn_cnt_avg: convertToFixed(Number.parseFloat(CNCnt.rows[0].avg), 1),
            cn_cnt_rank: CNCntRanking.rows.length > 0 ? Number.parseInt(CNCntRanking.rows[0].rank) : null,
            cn_cnt_total_rank: CNCntRanking.rows.length > 0 ? Number.parseInt(CNCntRanking.rows[0].total_rank) : null,
            wp_covering_percent: convertToFixed(Number.parseInt(wpCovering.rows[0].percent), 2),
            distr_of_work_time_status: distrOfWorkTimeByStatus.rows.map(row => ({
                color: row.color,
                name: row.name,
                percent: Number.parseInt(row.percent),
            })),
            distr_of_work_time_by_distance: distrOfWorkTimeByDistance.rows.map(row => ({
                index: Number.parseFloat(row.index),
                distance: Number.parseFloat(row.distance),
            })),
            cn_cnt_by_status: CNCntByStatus.rows.map(row => ({
                name: row.name,
                count: Number.parseInt(row.count),
            })),
            cn_cnt_by_violation: CNCntByViolation.rows.map(row => ({
                name: row.name,
                count: Number.parseInt(row.count),
            })),
            violation_cnt_by_violation_type: violationCntByViolationType.rows.reduce((acc, row) => {
                const key = row.type;

                if (key in acc) {
                    acc[key].push({
                        hour: row.hour,
                        count: Number.parseInt(row.count),
                    });
                } else {
                    acc[key] = [
                        {
                            hour: row.hour,
                            count: Number.parseInt(row.count),
                        },
                    ];
                }

                return acc;
            }, {}),
            violation_cnt_by_plate_type: violationCntByPlateType.rows.reduce((acc, row) => {
                const key = row.type;

                if (key in acc) {
                    acc[key].push({
                        hour: row.hour,
                        count: Number.parseInt(row.count),
                    });
                } else {
                    acc[key] = [
                        {
                            hour: row.hour,
                            count: Number.parseInt(row.count),
                        },
                    ];
                }


                return acc;
            }, {}),
            job_cnt_by_triggered: [
                {
                    type: 'Triggered',
                    count: Number.parseInt(jobCntByTriggered.rows[0].triggered),
                },
                {
                    type: 'Non triggered',
                    count: Number.parseInt(jobCntByTriggered.rows[0].non_triggered),
                },
            ],
            job_cnt_by_type: jobCntByType.rows.map(row => ({
                type: row.type,
                count: Number.parseInt(row.count),
            })),
            violation_cnt_by_street: violationCntByStreet.rows.map(row => ({
                name: row.name,
                count: Number.parseInt(row.count),
            })),
            walking_distance_per_day_km: Number.parseFloat(walkingDistancePerDay.rows[0].distance_kilometers),
            minutes_for_observation: minutesForObservation.rows.map(row => ({
                hour: Number.parseInt(row.hour),
                avg_observation_time: Number.parseFloat(row.avg_observation_time),
            })),
        };

        return res.status(200).json(responseData);
    } catch (err) {
        next(err);
    }
};

exports.getMapStatisticByEmployeeId = async (req, res, next) => {
    const {employee_id = null} = req.params;
    const {project_id = null} = req.query;

    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    if (Number.isNaN(from) || Number.isNaN(to)) {
        return res.status(400).json({message: 'invalid date'});
    }

    try {
        const [
            movement,
            contraventions,
        ] = await Promise.all([
            model.getMovement({employee_id, project_id, from, to}),
            model.getContraventionsForMap({employee_id, project_id, from, to}),
        ]);

        const responseData = {
            movement: movement.rows.reduce((acc, row) => {
                const key = format(row.sent_at);

                if (key in acc) {
                    acc[key].push([
                        Number.parseFloat(row.longitude),
                        Number.parseFloat(row.latitude),
                    ]);
                } else {
                    acc[key] = [
                        [
                            Number.parseFloat(row.longitude),
                            Number.parseFloat(row.latitude),
                        ]
                    ];
                }

                return acc;
            }, {}),
            contraventions: contraventions.rows.map(row => ({
                ...row,
                longitude: Number.parseFloat(row.longitude),
                latitude: Number.parseFloat(row.latitude),
            })),
        };

        return res.status(200).json(responseData);
    } catch (err) {
        next(err);
    }
};
