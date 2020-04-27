var violationModel = require("../api/pg/violation/violation.model");

const create = async (req, res, next) => {
  try {
    var response = await violationModel.create(req.body);
  } catch (e) {
    return res.status(400).json({ message: next(e) });
  }
  return res.status(201).json({ message: "created." });
};

const get = async (req, res, next) => {
  try {
    var response = await violationModel.get(req.query);
  } catch (e) {
    return next(e);
  }
  return res.status(200).json(response.rows);
};

/**
 * For Maps mobile, OSES
 * @param req {query: {project_code, violation_code, datetime}}
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getAssignedViolationDetail = async (req, res, next) => {
  try {
    if (!req.params.projectCode || !req.params.violationCode) {
      return res.status(400).json({message: "Missing data"});
    }
    const response = await violationModel.getAssignedViolationDetail({
      projectCd: req.params.projectCode,
      violationCd: req.params.violationCode,
      datetime: req.params.datetime,
    });
    if (response !== null && response.rowCount > 0) {
      return res.status(200).json(response.rows);
    } else {
      return res.status(400).json({message: "No violation for this project code & violation code"});
    }
  } catch (error) {
      return next(error);
  }
};

/**
 * Experimental API - checking whether OSES will use this or not
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getSelectedAssignmentDetail = async (req, res, next) => {
  try {
    if (!req.params.projectId || !req.params.assignmentId) {
      return res.status(400).json({ message: "Missing data" });
    }
    const assignment = await violationModel.getSelectedAssignment({
      project_id: req.params.projectId,
      assignment_id: req.params.assignmentId,
    });

    if (assignment !== null && assignment.rowCount > 0) {
      return res.status(200).json(assignment.rows);
    } else {
      return res.status(400).json({message: "No violation for this project id & assignment id"});
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * For Maps mobile and OSES
 * @param req {params: {projectId, datetime}}
 *  For Maps mobile: datetime: null --> now()
 *  For OSES: defined datetime
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getAssignmentListByProject = async (req, res, next) => {
  try {
    /* get only the violation assignments for selected datetime */
    const response = await violationModel.getViolationAssignmentList({
      projectId: req.params.projectId,
      datetime: req.params.datetime,
    });
    const violations = response.rows;

    for (let i = 0; i < violations.length; i++) {

      if (!violations[i].observation_min || violations[i].observation_min <= 0) {
        // observation_min <= 0 or null
        violations[i].decision = 'Direct Ticket';
        violations[i].observation_time = 0;
      } else {
        // observation_min > 0
        violations[i].decision = 'Observation';
        violations[i].observation_time = violations[i].observation_min;
      }
      if (violations[i].action_clamp === true) {
        violations[i].decision = 'Direct Clamp';
        violations[i].observation_time = 0;
      }
      if (violations[i].action_tow === true) {
        violations[i].decision = 'Direct TOW';
        violations[i].observation_time = 0;
      }
      violations[i].observation_min = undefined;
    }
    return res.status(200).json(violations);
  } catch (e) {
    return next(e);
  }
};

const update = async (req, res, next) => {
  id = req.body.id;
  if (id) {
    return violationModel
      .get({ id: id })
      .then(result => {
        if (result && result.rows && result.rows[0]) {
          return violationModel.edit(req.body).then(UpdatedViolation => {
            return res.status(200).json({ message: 'Violation is updated successfully.' });
          });
        } else return res.status(400).json({ error: "Invalid user data." });
      })
      .catch(function(e) {
        next(e);
      });
  }
};

const del = async (req, res, next) => {
  try {
    var checkIfViolationExist = await violationModel.get(req.query);
  } catch (e) {
    return next(e);
  }
  if (checkIfViolationExist && checkIfViolationExist.rowLength > 0) {
    try {
      var response = await violationModel.del({id: req.query.id});
    } catch (e) {
      return next(e);
    }
    return res.status(202).json({ message: 'Violation is deleted successfully.' });
  } else {
    return res.status(202).json({ error: "Invalid violation data." });
  }
};

const deleteByProject = async (req, res, next) => {
  try {
    return violationModel.get(req.query).then(results => {
      if (results && results.rowLength > 0) {
        for (let result of results) {
          violationModel.del({id: result.id}).catch(e => {
            return res.status(400).json({ message: e.toString() });
          });
        }
        return res.status(202).json({ message: "success." });
      } else {
        return res
          .status(400)
          .json({ error: "Invalid violation-assignment data." });
      }
    });
  } catch (e) {
    return res.status(400).json({ message: e.toString() });
  }
};

exports.deleteByProject = deleteByProject;
exports.create = create;
exports.get = get;
exports.update = update;
exports.del = del;
exports.getAssignmentListByProject = getAssignmentListByProject;
exports.getAssignedViolationDetail = getAssignedViolationDetail;
exports.getSelectedAssignmentDetail = getSelectedAssignmentDetail;
