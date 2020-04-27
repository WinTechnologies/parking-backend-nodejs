const model = require('./workplans.model');
const modelException = require('../exceptions/exceptions.model');
const modelReoccuring = require('../reoccurings/reoccurings.model');
const modelEmployeeWp = require('../employee-wp/employee_wp.model');

const create = async (req, res, next) => {
    let data = req.body;

    try {
        const workplan  = await model.create({
            created_by: req._user.employee_id,
            ...data
        });
        if (!workplan.rows || !workplan.rows.length || !workplan.rows[0].id) {
            throw new Error('Can\'t create workplan record!');
        }

        await Promise.all([
            modelReoccuring.bulkCreate({
                workplan_id: workplan.rows[0].id,
                reoccurings: data.reoccurings,
                created_by: req._user.employee_id,
                date_start: data.date_start,
                date_end: data.date_end,
            }),
            modelException.bulkCreate({
                workplan_id: workplan.rows[0].id,
                exceptions: data.exceptions,
                created_by: req._user.employee_id,
            }),
        ]);
        return res.status(201).json({message: 'created.'});
    } catch(err) {
        return res.status(400).json({message: err});
    }
};

const getAll = async (req, res, next) => {
    try {
        const response = await model.getAll(req.query);
        const workplans = response.rows;
        for (let i = 0; i < workplans.length; i++) {
            let w = workplans[i];
            const [reoccurings, exceptions, employees] = await Promise.all([
                // TODO: This can be done by one sql using join
                modelReoccuring.getAll({ workplan_id: w.id }),
                modelException.getAll({ workplan_id: w.id }),
                modelEmployeeWp.getAll({ workplan_id: w.id }),
            ]);
            w['exceptions'] = exceptions.rows;
            w['reoccurings'] = reoccurings.rows;
            w['employees'] = employees.rows;
        }
 
        return res.status(200).json(workplans);
    }
    catch(e) {
        return res.status(400).json({message: e.message});
    }
};

const getEmployeeWorkplan = async (req, res, next) => {
    const employee_id = req.params.employee_id;

    try {
        let employeeWP = await modelEmployeeWp.getAll({employee_id});

        if (!employeeWP || !employeeWP.rows || !employeeWP.rows.length) {
            return res.status(404).json({message: 'no employee workplan data'});
        }
        employeeWP = employeeWP.rows[0];

        let workplan =  await model.getAll({id: employeeWP.workplan_id});
        if (!workplan || !workplan.rows || !workplan.rows.length) {
            return res.status(404).json({message: 'no workplan data'});
        }
        workplan = workplan.rows[0];

        const [reoccurings, exceptions] = await Promise.all([
            // TODO: This can be done by one sql using join
            modelReoccuring.getByIdList(employeeWP.wp_reoccuring_id),
            modelException.getByIdList(employeeWP.wp_exception_id),
        ]);
        workplan['exceptions'] = exceptions.rows;
        workplan['reoccurings'] = reoccurings.rows;

        return res.status(200).json(workplan);
    }
    catch(e) {
        return res.status(400).json({message: e.message});
    }
};

const update = async (req, res, next) => {
    const wp_name = req.params.wp_name;
    if(wp_name) {
        return model.getAll({wp_name}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(wp_name, req.body).then(updatedWp => {
                    return res.status(202).json({message: 'success.'});
                });
            } else return res.status(202).json({error: 'Invalid asset data.'});
        });
    }
};

const updateReoccurings = async (req, res, next) => {
    const workplan_id = req.params.workplan_id;

    if(workplan_id) {
        try {
            const workplan = await model.getAll({id: workplan_id});
            if (workplan && workplan.rows && workplan.rows[0]) {
                const reoccurings = [...req.body.reoccurings];

                let idList = [];
                let updateList = [];
                let createList = [];
                let deleteList = req.body.deleteReoccurings && req.body.deleteReoccurings.length ? [...req.body.deleteReoccurings] : [];

                // Remove reoccurings
                if (deleteList.length) {
                    await modelReoccuring.bulkUpdateByWP(workplan_id, {
                        deleted_by: req._user.employee_id,
                        deleted_at: new Date().toISOString(),
                    }, deleteList);
                }

                reoccurings.forEach(r => {
                    if (r.id) {
                        idList.push(r.id);
                        updateList.push(r);
                    } else {
                        createList.push(r);
                    }
                });

                // Update old reoccurings
                updateList.forEach(async r => {
                    // TODO: update history like created_by
                    await modelReoccuring.updateById(r.id, {
                        date_start: req.body.date_start,
                        date_end: req.body.date_end,
                        ...r,
                    });
                });

                // Add new reoccurings
                let newReoccurings;
                if (createList.length) {
                    newReoccurings = await modelReoccuring.bulkCreate({
                        workplan_id: workplan_id,
                        reoccurings: createList,
                        created_by: req._user.employee_id,
                        date_start: req.body.date_start,
                        date_end: req.body.date_end,
                    });
                    if (newReoccurings.rows && newReoccurings.rows.length) {
                        idList.push(newReoccurings.rows.map(el => el.id));
                    }
                }

                // Update Employee_wp
                idList = '{' + idList.join(',') + '}';
                await modelEmployeeWp.updateWPReoccurings(workplan_id, idList);
                return res.status(200).send({message: 'Success'});
            } else {
                return res.status(202).json({error: 'Workplan doesn\'t exist'});
            }
        } catch (err) {
            return res.status(500).json({message: err});
        }
    }
};

const updateExceptions = async (req, res, next) => {
    const workplan_id = req.params.workplan_id;

    if(workplan_id) {
        try {
            const workplan = await model.getAll({id: workplan_id});
            if (workplan && workplan.rows && workplan.rows[0]) {
                const exceptions = [...req.body.exceptions];

                let idList = [];
                let updateList = [];
                let createList = [];
                let deleteList = req.body.deleteExceptions && req.body.deleteExceptions.length ? [...req.body.deleteExceptions] : [];

                // Remove exceptions
                if (deleteList.length) {
                    await modelException.bulkUpdateByWP(workplan_id, {
                        deleted_by: req._user.employee_id,
                        deleted_at: new Date().toISOString(),
                    }, deleteList);
                }

                exceptions.forEach(r => {
                    if (r.id) {
                        idList.push(r.id);
                        updateList.push(r);
                    } else {
                        createList.push(r);
                    }
                });

                // Update old exceptions
                updateList.forEach(async r => {
                    // TODO: update history like created_by
                    await modelException.updateById(r.id, r);
                });

                // Add new exceptions
                let newExceptions;
                if (createList.length) {
                    newExceptions = await modelException.bulkCreate({
                        workplan_id: workplan_id,
                        exceptions: createList,
                        created_by: req._user.employee_id,
                    });
                    if (newExceptions.rows && newExceptions.rows.length) {
                        idList.push(newExceptions.rows.map(el => el.id));
                    }
                }

                // Update Employee_wp
                idList = '{' + idList.join(',') + '}';
                await modelEmployeeWp.updateWPExceptions(workplan_id, idList);
                return res.status(200).send({message: 'Success'});
            } else {
                return res.status(202).json({error: 'Workplan doesn\'t exist'});
            }
        } catch (err) {
            return res.status(500).json({message: err});
        }
    }
};

const updateEmployeeReoccurings = async(req, res, next) => {
    const employee_id = req.params.employee_id;
    const workplan_id = req.body.workplan_id;

    if(employee_id) {
        try {
            const employeeWP = await modelEmployeeWp.getAll({employee_id});
            console.log(employeeWP.rows)
            if (employeeWP && employeeWP.rows && employeeWP.rows[0]) {
                const reoccurings = [...req.body.reoccurings];
                let idList = [];
                let createList = [];
                reoccurings.forEach(r => r.id ? idList.push(r.id) : createList.push(r));

                // Add new reoccurings
                let newReoccurings;
                if (createList.length) {
                    newReoccurings = await modelReoccuring.bulkCreate({
                        workplan_id: workplan_id,
                        newReoccurings: createList,
                        created_by: req._user.employee_id,
                    });
                    if (newReoccurings.rows && newReoccurings.rows.length) {
                        idList.push(newReoccurings.rows.map(el => el.id));
                    }
                }

                // Update Employee_wp
                idList = '{' + idList.join(',') + '}';
                await modelEmployeeWp.updateEmployeeReoccurings(employee_id, idList);

                return res.status(200).send({message: 'Success'});
            } else {
                return res.status(202).json({error: 'Workplan doesn\'t exist'});
            }
        } catch (err) {
            return res.status(500).json({message: err});
        }
    }
};

const updateEmployeeExceptions = async (req, res, next) => {
    const employee_id = req.params.employee_id;
    const workplan_id = req.body.workplan_id;

    if(employee_id) {
        try {
            const employeeWP = await modelEmployeeWp.getAll({employee_id});

            if (employeeWP && employeeWP.rows && employeeWP.rows[0]) {
                const exceptions = [...req.body.exceptions];
                let idList = [];
                let createList = [];
                exceptions.forEach(r => r.id ? idList.push(r.id) : createList.push(r));

                // Add new exceptions
                let newExceptions;
                if (createList.length) {
                    newExceptions = await modelException.bulkCreate({
                        workplan_id: workplan_id,
                        exceptions: createList,
                        created_by: req._user.employee_id,
                    });
                    if (newExceptions.rows && newExceptions.rows.length) {
                        idList.push(newExceptions.rows.map(el => el.id));
                    }
                }

                // Update Employee_wp
                idList = '{' + idList.join(',') + '}';
                await modelEmployeeWp.updateEmployeeExceptions(employee_id, idList);

                return res.status(200).send({message: 'Success'});
            } else {
                return res.status(202).json({error: 'Workplan doesn\'t exist'});
            }
        } catch (err) {
            return res.status(500).json({message: err});
        }
    }
};

const del = async (req, res, next) => {
    const wp_name = req.params.wp_name;
    if(wp_name) {
        return model.getAll({wp_name}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(wp_name, {
                    deleted_by: req._user.employee_id,
                    deleted_at: new Date().toISOString(),
                }).then(deletedWp => {
                    return res.status(200).json({message: 'deleted.'});
                }).catch(err => {
                    return res.status(500).json({message: err});
                });
            } else return res.status(202).json({error: 'Invalid data.'});
        });
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getEmployeeWorkplan = getEmployeeWorkplan;
exports.update = update;
exports.updateReoccurings = updateReoccurings;
exports.updateExceptions = updateExceptions;
exports.updateEmployeeReoccurings = updateEmployeeReoccurings;
exports.updateEmployeeExceptions = updateEmployeeExceptions;
exports.del = del;
