const model = require('./projects.model');
const client = require('../../../helpers/postgresClient');

const create = async (req, res, next) => {
    try {
        const currentUser = req._user.employee_id;
        const result = await model.create(req.body, currentUser);
        return res.status(201).json({ message: 'created.', project: result.rows });
    } catch (err) {
        next(err);
    }
};

const getAllProjectsOfConnectedUser = async (req, res, next) => {
    try {
        const connectedUser = req._user.employee_id;
        const result = await model.getAllProjectsOfConnectedUser(connectedUser);
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const getAllWithActivity = async (req, res, next) => {
    try {
        const result = await model.getAllWithActivity(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const getNextProjectCode = async (req, res, next) => {
    try {
        const result = await client.query(`SELECT next_val('project_code_counter') AS next_project_code`);
        let projectCode = 'PRJ';

        if (result && result.rows && result.rows[0]) {
            projectCode = `${projectCode}00${result.rows[0].next_project_code}`;
        } else {
            projectCode  = `${projectCode}001`;
        }

        return res.status(200).json(projectCode);
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const project_id = req.params.project_id;
        return model.getProjectById(project_id).then(result => {
            if (result && result.rows && result.rows[0]) {
                // To check if the project name is already used
                return model.getProjectByName(req.body.project_name).then(result1 => {
                    if (result1 && result1.rows && result1.rows[0]) {
                        if(result1.rows[0].id === parseInt(project_id)) {
                            return model.update(project_id, req.body).then(Updated => {
                                return res.status(202).json({message: 'updated.'});
                            });
                        } else {
                            return res.status(400).json({error: 'This project name is already used'});
                        }
                    } else {
                        return model.update(project_id, req.body).then(Updated => {
                            return res.status(202).json({message: 'updated.'});
                        });
                    }
                });
            } else {
                return res.status(400).json({error: 'Invalid data.'});
            }
        });

    } catch (err) {
        next(err);
    }
};

const del = async (req, res, next) => {
    const project_id = req.params.project_id;
    const employee = req._user;

    try {
        // TODO: replace another model func instead of getAllProjectsOfConnectedUser
        const result = await model.getProjectById(project_id);
        if (result && result.rows && result.rows[0]) {
            const updateBody = {
                deleted_by: employee.employee_id,
                deleted_at: new Date(),
            };
            return model.update(project_id, updateBody).then(Updated => {
                return res.status(202).json({message: 'deleted.'});
            });
        } else {
            return res.status(202).json({error: 'Invalid data.'});
        }
    } catch(err) {
        next(err);
    }
};

const checkCodeExists = async (req, res, next) => {
    try {
        const params = {
            id: req.query.project_id,
            code: req.query.project_code,
        };

        const result = await model.checkCodeExists(params);
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const getProjectById = async (req, res, next) => {
  model.getProjectById(req.params.project_id).then(result => {
      return res.status(200).json({
          ...result.rows[0],
          center_longitude: result.rows[0].center_longitude ? Number.parseFloat(result.rows[0].center_longitude): null,
          center_latitude: result.rows[0].center_latitude ? Number.parseFloat(result.rows[0].center_latitude) : null,
      });
  }).catch(err => {
      next(err);
  });
};

exports.create = create;
exports.getAllProjectsOfConnectedUser = getAllProjectsOfConnectedUser;
exports.getAllWithActivity = getAllWithActivity;
exports.getNextProjectCode = getNextProjectCode;
exports.update = update;
exports.delete = del;
exports.checkCodeExists = checkCodeExists;
exports.getProjectById = getProjectById;
