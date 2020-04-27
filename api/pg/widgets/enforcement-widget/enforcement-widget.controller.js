const sequelize  = require('../../sequelize-models').sequelize;
const Op = sequelize.Op;

const actEnforcementPredictionModel = require('../../sequelize-models').act_enforcement_prediction;
const projectEmployeeModel = require('../../sequelize-models').project_employee;
const employeeModel = require('../../sequelize-models').employee;
const contraventionModel = require('../../sequelize-models').contravention;
const jobModel = require('../../sequelize-models').job;

const jobPositions = [
    {assigned: 'ENFORCER', predicted: 'EO', job_type: ''},
    {assigned: 'TOW DRIVER', predicted: 'Tow Truck', job_type: 'TOW JOB'},
    {assigned: 'CLAMP DRIVER', predicted: 'Clamp Van', job_type: 'CLAMP JOB'},
];
const workplanTime = 900; // in minutes, 15 hours


const get = (req, res, next) => {
    getByQuery(req.query)
        .then(response => res.status(200).json(response))
        .catch(err => {
            return res.status(400).json({ message: err.message })
        });
};

const getByQuery = (query) => {
    return Promise.all([
        getJobPositionAssignAndPredictions(query),
        getATVInfo(query),
        getJobChatInfo(query),
    ]).then(([enforcementModelResult, jobPositionAssignAndPredictions, ATVInfo, jobChatInfo]) => ({
        ...enforcementModelResult,
        ...jobPositionAssignAndPredictions,
        ...ATVInfo,
        ...jobChatInfo,
    }));
};

const getJobPositionAssignAndPredictions = ({project_id}) => {
    return Promise.all(jobPositions.map(position => {
        return Promise.all([
            getJobPositionAssigned(project_id, position.assigned),
            getJobPositionPrediction(project_id, position.predicted)
        ]).then(([assigned, predicted]) => {return `${assigned}/${predicted}`})
    })).then(([eoChart, towTruckChart, clampVanChart]) => {
        return { eoChart, towTruckChart, clampVanChart }
    });
};

const getATVInfo = ({project_id, day}) => {
    const jobStatuses = ['TOWED', 'CLAMPED'];

    return Promise.all(jobStatuses.map(status => {
        return Promise.all([
            getJobAmount(day, project_id, status),
            getJobCompletedCount(day, project_id, status)
        ]).then(([amount, count]) => count > 0 ? amount/count : 0 )
    })).then(([atvTowed, atvClamped]) => {
        return { atvTowed, atvClamped }
    });
};

const getJobChatInfo = ({day, project_id}) => {
    return Promise.all(jobPositions.map(position => {
        const promises = [];

        if (position.predicted === 'EO') {
            promises.push(getContraventionsCount(day, project_id))
        } else {
            promises.push(getJobCount(day, project_id, position.job_type))
        }

        promises.push(getJobPositionAssigned(project_id, position.assigned));
        promises.push(getJobPositionPrediction(project_id, position.predicted));
        promises.push(getIssuanceRate(project_id, position.predicted));

        return Promise.all(promises)
            .then(([count, assigned, predicted, issuance]) => {
                const expectedCount = +(assigned * workplanTime / issuance).toFixed(0);
                const predictedCount = +(predicted * workplanTime / issuance).toFixed(0);
                return {
                    count,
                    deployed: expectedCount,
                    predicted: predictedCount
                }})
    })).then(([eoInfo, towInfo, clampInfo]) => {
        return { eoInfo, towInfo, clampInfo }
    });
};

const getJobAmount = async (day, project_id, status) => {
    const jobs = await jobModel.findAll({
        where: {
            [Op.and]: [
                { project_id: project_id, status },
                sequelize.where(sequelize.fn('DATE', sequelize.col('job.sent_at')), day)
            ]
        },
        include: [{
            model: contraventionModel,
            as: 'contravention',
            where: {
                is_paid: {
                    [Op.not]: true
                }
            }
        }]
    });

    const amountSum = jobs.map((job) => {
        return job.contravention ? job.amount + job.contravention.amount : job.amount
    });

    return amountSum && amountSum.length > 0 ? amountSum.reduce((a, b) => a + b) : 0
};

const getContraventionsCount = async (day, project_id) => {
    return contraventionModel.count({
        where: {
            [Op.and]: [
                { project_id: project_id },
                sequelize.where(sequelize.fn('DATE', sequelize.col('sent_at')), day)
            ]
        }
    });
};

const getIssuanceRate = async (project_id, job_position) => {
    const prediction = await actEnforcementPredictionModel.findOne({
        where: { project_id, job_position }
    });
    return prediction ? prediction.issuance_rate : 0;
};

const getJobCount = async (day, project_id, job_type) => {
    return jobModel.count({
        where: {
            [Op.and]: [
                { project_id: project_id, job_type },
                sequelize.where(sequelize.fn('DATE', sequelize.col('sent_at')), day)
            ]
        }
    });
};

const getJobCompletedCount = async (day, project_id, status) => {
    return jobModel.count({
        where: {
            [Op.and]: [
                { project_id: project_id, status },
                sequelize.where(sequelize.fn('DATE', sequelize.col('sent_at')), day)
            ]
        }
    });
};

const getJobPositionPrediction = async (project_id, position) => {
    const prediction = await actEnforcementPredictionModel
        .findOne({
            where: { job_position: position, project_id: project_id },
        });
    return prediction ? prediction.forecast_deployed || 0 : 0;
};

const getJobPositionAssigned = (project_id, position) => {
    return projectEmployeeModel.count({
        where: { project_id: project_id },
        include: [{  model: employeeModel, as: 'employee', where: { job_position: position } }]
    });
};

exports.get = get;
exports.getByQuery = getByQuery;
