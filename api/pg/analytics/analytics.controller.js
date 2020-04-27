const model = require('./analytics.model');

const employeeModel = require('./../sequelize-models').employee;
const projectModel = require('./../sequelize-models').project;
const dashboardModel = require('./../sequelize-models').dashboard;
const chartModel = require('./../sequelize-models').chart;
const groupLibModel = require('./../sequelize-models').group_library;
const Op = require('./../sequelize-models').Sequelize.Op;
const sequelize  = require('./../sequelize-models').sequelize;

/**
 * Analytics / Library Groups
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getAllEmployees = async (req, res, next) => {
    try {
        const employees = await employeeModel.findAll();
        return res.status(200).send(employees);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / All Library
 *  Get current authorized user's reports(from dashboard, chart)
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllReports = async (req, res, next) => {
    /**
     * 1. Get dashboards with charts
     * 2. Get groups info
     */
    try {
        const employee = req._user;
        /**
            SELECT "dashboard"."id", "dashboard"."name", "dashboard"."project_id", "dashboard"."is_public", "dashboard"."group_library_id",
                "dashboard"."created_by", "dashboard"."created_at", "dashboard"."modified_by", "dashboard"."modified_at",
                "project"."id" AS "project.id", "project"."project_name" AS "project.project_name", "project"."project_code" AS "project.project_code",
                "project"."vat_id" AS "project.vat_id", "project"."currency_code" AS "project.currency_code"
            FROM "dashboard" AS "dashboard"
            LEFT OUTER JOIN "project" AS "project" ON "dashboard"."project_id" = "project"."id"
            WHERE (("dashboard"."created_by" = 'CEO9876' OR "dashboard"."is_public" = true)
            AND ("project"."deleted_at" IS NULL OR "dashboard"."project_id" IS NULL));
         */
        const result = await dashboardModel
            .findAll({
                where: [
                        {[Op.or]: [
                            {created_by: employee.employee_id},
                            {is_public: true},
                        ]},
                        {[Op.or]:[
                            {'$project.deleted_at$': {[Op.is]: null}},
                            {project_id: {[Op.is]: null}}
                        ]},
                ],
                include: [{
                    model: projectModel,
                    as: 'project',
                }],
            });

        const dashboards = result.map(dashboard => {
            dashboard.dataValues['created_by_me'] = dashboard.created_by === employee.employee_id;
            return dashboard;
        });
        return res.status(200).send(dashboards);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / All Library
 *  Get current authorized user's reports(from dashboard, chart)
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getReportsByProject = async (req, res, next) => {
    /**
     * 1. Get dashboards with charts
     * 2. Get groups info
     */
    try {
        const employee = req._user;
        const projectId = req.params.id;

        const result = await dashboardModel
            .findAll({
                where: {
                    [Op.or]: [
                        {created_by: employee.employee_id},
                        {is_public: true},
                    ],
                    project_id: projectId,
                    '$project.deleted_at$': {[Op.is]: null}
                },
                include: [{
                    model: projectModel,
                    as: 'project',
                }],
            });
        const dashboards = result.map(dashboard => {
            dashboard.dataValues['created_by_me'] = dashboard.created_by === employee.employee_id;
            return dashboard;
        });
        return res.status(200).send(dashboards);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / My Library
 *  Get current authorized user's reports(from dashboard, chart)
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getEmployeeReports = async (req, res, next) => {
    /**
     * 1. Get dashboards with charts
     * 2. Get groups info
     */
    try {
        const employee = req._user;

        const result = await dashboardModel
            .findAll({
                where: {
                    created_by: employee.employee_id,
                    [Op.or]:[
                        {'$project.deleted_at$': {[Op.is]: null}},
                        {project_id: {[Op.is]: null}}
                    ],
                },
                include: [{
                    model: projectModel,
                    as: 'project',
                }],
            });
        const dashboards = result.map(dashboard => {
            dashboard.dataValues['created_by_me'] = dashboard.created_by === employee.employee_id;
            return dashboard;
        });
        return res.status(200).send(dashboards);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / Public Library
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getPublicReports = async (req, res, next) => {
    try {
        const employee = req._user;
        const result = await dashboardModel
            .findAll({
                where: {
                    is_public: true,
                    [Op.or]:[
                        {'$project.deleted_at$': {[Op.is]: null}},
                        {project_id: {[Op.is]: null}}
                    ],
                },
                include: [{
                    model: projectModel,
                    as: 'project',
                }],
            });
        const dashboards = result.map(dashboard => {
            dashboard.dataValues['created_by_me'] = dashboard.created_by === employee.employee_id;
            return dashboard;
        });
        return res.status(200).send(dashboards);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / Group Library
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getGroupReports = async (req, res, next) => {
    try {
        const employee = req._user;
        const projectId = parseInt(req.query.projectId);
        const groupIds = await groupLibModel
            .findAll({
                where: {
                    member: { [Op.contains]: [employee.employee_id] },
                },
                attributes: ['id'],
            });
        const groupLibIds = groupIds.map(value => value.id);
        let where = {
            group_library_id: { [Op.overlap]: groupLibIds },
            [Op.or]: [
                {'$project.deleted_at$': {[Op.is]: null}},
                {project_id: {[Op.is]: null}}
            ]
        };
        if (projectId > 0) {
            where = {
                group_library_id: { [Op.overlap]: groupLibIds },
                project_id: projectId
            };
        }
        const result = await dashboardModel
            .findAll({
                where: where,
                include: {
                    model: projectModel,
                    as: 'project',
                },
            });
        const dashboards = result.map(dashboard => {
            dashboard.dataValues['created_by_me'] = dashboard.created_by === employee.employee_id;
            return dashboard;
        });
        return res.status(200).send(dashboards);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / Report Detail
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getReportDetail = async (req, res, next) => {
    try {
        const dashboard = await dashboardModel
            .findOne({
                where: {
                    id: req.params.id,
                },
                include: [{
                    model: chartModel,
                    as: 'charts',
                }],
            });
        const projectId = dashboard.project_id;
        const chartDataSets = await Promise.all(dashboard.charts.map(async curChart => {
            /**
             * @param curChart.params from chart table
             *  JSON string
             *  {
             *   "axes": {
             *     "x": "creation",
             *     "y": "amount",
             *     "z": "status"
             *   },
             *   "extra": {
             *     "aggregation":"SUM",
             *     "computation":"percentage"
             *   },
             *   "date": "creation",
             *   "group_date": "week"
             * }';
             */
            try {
                const dataSet = await model.runAnalyticsQuery(curChart, req.query, projectId);
                const chartItem = {
                    settings: {
                        ...curChart.dataValues,
                        parameters: JSON.parse(curChart.params).axes,
                        extra_params: JSON.parse(curChart.params).extra,
                        date_param: JSON.parse(curChart.params).date,
                        group_by_date_param:JSON.parse(curChart.params).group_date,
                    },
                    dataSets: dataSet.rows
                };
                return Promise.resolve(chartItem);
            } catch (err) {
                return Promise.reject(err);
            }
        }));
        return res.status(200).send(chartDataSets);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / make a Report Public
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const shareReportToAll = async (req, res, next) => {
    try {
        const dashboard_id = req.params.id;
        const employee = req._user;

        const dashboard = await dashboardModel
            .findOne({
            where: {
                id: dashboard_id,
            }
        });
        if (!dashboard) {
            return res.status(404).json({ message: 'Report not found!' });
        }
        const result = await dashboard.update({
            is_public: true,
            modified_by: employee.employee_id,
            modified_at: new Date(),
        });
        return res.status(201).json({ message: 'Dashboard has been set public.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / make a Report Private
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const privateReport = async (req, res, next) => {
    try {
        const dashboard_id = req.params.id;
        const employee = req._user;

        const dashboard = await dashboardModel
            .findOne({
                where: {
                    id: dashboard_id,
                }
            });
        if (!dashboard) {
            return res.status(404).json({ message: 'Report not found!' });
        }
        const result = await dashboard.update({
            is_public: false,
            modified_by: employee.employee_id,
            modified_at: new Date(),
        });
        return res.status(201).json({ message: 'Dashboard has been set private.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / Share to a Library Group Report
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const shareReportToGroup = async (req, res, next) => {
    try {
        const report_id = req.params.report_id;
        const group_id = req.params.group_id;
        const employee = req._user;

        const dashboard = await dashboardModel
            .findOne({
                where: {
                    id: report_id,
                }
            });
        if (!dashboard) {
            return res.status(404).json({ message: 'Report not found!' });
        }
        let groupIds = dashboard.group_library_id;
        if (groupIds.includes(parseInt(group_id))) {
            return res.status(404).json({ message: 'Report had already shared to this group!' });
        }
        groupIds.push(group_id);
        const result = await dashboard.update({
            group_library_id: groupIds,
            modified_by: employee.employee_id,
            modified_at: new Date(),
        });
        return res.status(201).json({ message: 'success.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / Send to My Library
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const duplicateReport = async (req, res, next) => {
    try {
        const sourceId = req.params.id;
        const employee = req._user;

        const [sourceDash, sourceCharts] = await Promise.all([
            dashboardModel.findOne({
                where: {
                    id: sourceId,
                }
            }),
            chartModel.findAll({
                where: { dashboard_id: sourceId },
            })
        ]);
        if (!sourceDash) {
            return res.status(404).json({ message: 'Report not found!' });
        }
        const newDash = {
            name: `${sourceDash.name} COPY`,
            project_id:sourceDash.project_id,
            is_public: false,
            group_library_id: [],
            created_by: employee.employee_id,
        };

        await sequelize.transaction(async (t) => {
            const newDashboard = await dashboardModel
                .create(newDash, { transaction: t });
            if (!sourceCharts) {
                return newDashboard;
            }
            const promises = sourceCharts.map(sourceChart => {
                return chartModel.create({
                    name: sourceChart.name,
                    type: sourceChart.type,
                    db_table: sourceChart.db_table,
                    db_sql: sourceChart.db_sql,
                    params: sourceChart.params,
                    dashboard_id: newDashboard.id,
                    created_by: employee.employee_id,
                }, { transaction: t });
            });
            const result = await Promise.all(promises);
            return result;
        });

        return res.status(201).json({ message: 'success.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Analytics / Library Groups
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getLibraryGroups = async (req, res, next) => {
    try {
        const employee = req._user;
        const groups = await groupLibModel
            .findAll({
                include: [{
                    model: employeeModel,
                    as: 'creator',
                    attributes: { exclude: ['username', 'password', 'login_id', 'mobile_imei'] }
                },{
                    model: employeeModel,
                    as: 'modifier',
                    attributes: { exclude: ['username', 'password', 'login_id', 'mobile_imei'] }
                }],
            });

        const groupLibs = await Promise.all(
            groups.map(async group => {
                const [members, admins] = await Promise.all([
                    employeeModel.findAll({ where: { employee_id: group.member } }),
                    employeeModel.findAll({ where: { employee_id: group.admin_by } }),
                ]);
                group.dataValues['members'] = members;
                group.dataValues['admins'] = admins;
                group.dataValues['modified_by_me'] = group.modified_by === employee.employee_id;
                group.dataValues['created_by_me'] = group.created_by === employee.employee_id;
                group.dataValues['admin_by_me'] = group.admin_by.findIndex(el => el === employee.employee_id) !== -1;
                return group;
            })
        );
        return res.status(200).send(groupLibs);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const createLibraryGroups = async (req, res, next) => {
    try {
        const {
            name, member, admin_by
        } = req.body;
        const employee = req._user;
        const groupBody = {
            name,
            member: member,
            admin_by: admin_by,
            created_by: employee.employee_id,
        };

        await groupLibModel.create(groupBody);
        return res.status(201).json({ message: 'created.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const updateLibraryGroups = async (req, res, next) => {
    try {
        const group_id = req.params.id;

        const group = await groupLibModel
            .findOne({
                where: {
                    id: group_id,
                }
            });
        if (!group) {
            return res.status(404).json({ message: 'Group not found!' });
        }

        const {
            name, member, admin_by
        } = req.body;
        const employee = req._user;
        if (req.body.member.indexOf(employee.employee_id) < 0) {
            req.body.member.push(employee.employee_id);
        }
        if (req.body.admin_by.indexOf(employee.employee_id) < 0) {
            req.body.admin_by.push(employee.employee_id);
        }
        const groupBody = {
            name,
            member: member,
            admin_by: admin_by,
            modified_by: employee.employee_id,
            modified_at: new Date(),
        };

        const result = await group.update(groupBody);
        return res.status(201).json({ message: 'created.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const deleteLibraryGroups = async (req, res, next) => {
    try {
        const group_id = req.params.id;

        const group = await groupLibModel
            .findOne({
                where: {
                    id: group_id,
                }
            });
        if (!group) {
            return res.status(404).json({ message: 'Group not found!' });
        }

        await groupLibModel.destroy({
            where: {
                id: group_id,
            }
        });
        return res.status(200).json({
            message: 'success'
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Remove a member from a Library Group
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const removeGroupMember = async (req, res, next) => {
    try {
        const group_id = req.params.group_id;
        const member_id = req.params.employee_id;
        const employee = req._user;

        const group = await groupLibModel
            .findOne({
                where: {
                    id: group_id,
                }
            });
        if (!group) {
            return res.status(404).json({ message: 'Library Group not found!' });
        }
        const filteredMembers = group.member.filter(el => el !== member_id);
        const filteredAdmins = group.admin_by.filter(el => el !== member_id);
        await group.update({
            member: filteredMembers,
            admin_by: filteredAdmins,
            modified_by: employee.employee_id,
            modified_at: new Date(),
        });
        return res.status(201).json({ message: 'success.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Add new chart on a dashboard(report)
 * chart.params Format: JSON string
 *  {
 *   "axes": {
 *     "x": "creation",
 *     "y": "amount",
 *     "z": "status"
 *   },
 *   "extra": {
 *     "aggregation":"SUM",
 *     "computation":"percentage"
 *   },
 *   "date": "creation",
 *   "group_date": "week"
 * }';
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const addChart = async (req, res, next) => {
    try {
        const {
            dashboard_id, name, type, db_table,
            parameters, extra_params, date_param, group_by_date_param
        } = req.body;
        const employee = req._user;
        const chartBody = {
            dashboard_id, name, type, db_table,
            db_sql: '',
            params: JSON.stringify({
                axes: parameters,
                extra: extra_params,
                date: date_param,
                group_date: group_by_date_param,
            }),
            created_by: employee.employee_id,
        };

        await chartModel.create(chartBody);
        return res.status(201).json({ message: 'created.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const updateChart = async (req, res, next) => {
    try {
        const chart_id = req.params.id;

        const chart = await chartModel
            .findOne({
                where: {
                    id: chart_id,
                }
            });
        if (!chart) {
            return res.status(404).json({ message: 'Chart not found!' });
        }

        const {
            dashboard_id, name, type, db_table,
            parameters, extra_params, date_param, group_by_date_param
        } = req.body;

        const chartBody = {
            dashboard_id, name, type, db_table,
            db_sql: '',
            params: JSON.stringify({
                axes: parameters,
                extra: extra_params,
                date: date_param,
                group_date: group_by_date_param,
            }),
            modified_at: new Date(),
        };

        await chart.update(chartBody);
        return res.status(201).json({ message: 'created.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const delChart = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            return res.status(404).json({
                message: 'This Chart doesn\'t exist'
            });
        }
        await chartModel.destroy({
            where: {
                id: id,
            }
        });
        return res.status(200).json({
            message: 'success'
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const addReport = async (req, res, next) => {
    try {
        const {
            name, project_id
        } = req.body;
        const employee = req._user;

        const reportBody = {
            name, project_id,
            group_library_id: [],
            created_by: employee.employee_id,
        };

        await dashboardModel.create(reportBody);
        return res.status(201).json({ message: 'created.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// New Analytics module Controllers
exports.getAllEmployees = getAllEmployees;
exports.getAllReports = getAllReports;
exports.getPublicReports = getPublicReports;
exports.getEmployeeReports = getEmployeeReports;
exports.getGroupReports = getGroupReports;
exports.getReportDetail = getReportDetail;
exports.getLibraryGroups = getLibraryGroups;
exports.createLibraryGroups = createLibraryGroups;
exports.updateLibraryGroups = updateLibraryGroups;
exports.deleteLibraryGroups = deleteLibraryGroups;
exports.removeGroupMember = removeGroupMember;
exports.shareReportToAll = shareReportToAll;
exports.privateReport = privateReport;
exports.shareReportToGroup = shareReportToGroup;
exports.duplicateReport = duplicateReport;
exports.addChart = addChart;
exports.updateChart = updateChart;
exports.delChart = delChart;
exports.addReport = addReport;
exports.getReportsByProject = getReportsByProject;
