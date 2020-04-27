var jobModel = require("../../models/job");
var decodeMiddleware = require("../../middelware/decodeMiddleware");
const uuidv1 = require("uuid/v1");
const dateformat = require("dateformat");
var MQTTpublisher = require("../../api/services/MQTT/publisher");

const NEWJOB = "NEWJOB";
const REMOVEJOB = "REMOVEJOB";

const status_by_jobtypes = {
  types: {
    "CLAMP TO TOW": {
      start: "In progress",
      complete: "Closed",
      cancel: "Canceled"
    },
    "TOW JOB": {
      start: "Towing in progress",
      complete: "Closed",
      cancel: "Canceled"
    },
    "DECLAMP JOB": {
      start: "In progress",
      complete: "Closed",
      cancel: "Canceled"
    },
    "CLAMP JOB": {
      start: "In progress",
      complete: "Closed",
      cancel: "Canceled"
    }
  }
};

const create = async (req, res, next) => {
  const current_user = decodeMiddleware.getCurrentUser(req);
  var params = req.body;
  params["project_id"] = current_user.project_id;
  params["project_name"] = current_user.project_name;
  params["site_id"] = current_user.site_id;
  params["site_name"] = current_user.site_name;
  params["creator_username"] = current_user.username;
  params["status"] = "Open";
  params["id"] = uuidv1();
  params["creation"] = dateformat(
    new Date(),
    "dddd, mmmm dS, yyyy, h:MM:ss TT"
  );

  try {
    var response = await jobModel.create(req.body);
  } catch (e) {
    return next(e);
  }
  MQTTpublisher.publish(NEWJOB, req.body);
  return res.status(201).json({ message: "created." });
};

const get = async (req, res, next) => {
  try {
    var response = await jobModel.get(req.query);
  } catch (e) {
    return next(e);
  }
  return res.status(200).json({ rows: response.rows });
};

const getTowJobs = async (req, res, next) => {
  var results = [];
  try {
    const current_user = decodeMiddleware.getCurrentUser(req);
    var taken = await jobModel.get({
      taker_username: current_user.username,
      status: "Towing in progress"
    });
    var open = await jobModel.get({ status: "Open" });
  } catch (e) {
    return next(e);
  }
  if (taken.rows && open.rows) {
    results = filterByType(taken.rows.concat(open.rows), [
      "CLAMP TO TOW",
      "TOW JOB"
    ]);
  }
  return res.status(200).json({ rows: results });
};

// TODO: check if this API is no longer used
const getClamperJobs = async (req, res, next) => {
  var results = [];
  try {
    const current_user = decodeMiddleware.getCurrentUser(req);
    var taken = await jobModel.get({
      taker_username: current_user.username,
      status: "In progress"
    });
    var open = await jobModel.get({ status: "Open" });
  } catch (e) {
    return next(e);
  }
  if (taken.rows && open.rows) {
    results = filterByType(taken.rows.concat(open.rows), [
      "DECLAMP JOB",
      "CLAMP JOB"
    ]);
  }
  return res.status(200).json({ rows: results });
};

const history = async (req, res, next) => {
  try {
    const current_user = decodeMiddleware.getCurrentUser(req);
    req.body["taker_username"] = current_user.username;
    var result = await jobModel.history(req.body);
  } catch (e) {
    return next(e);
  }
  return res.status(200).json({ rows: result.rows });
};

const start = async (req, res, next) => {
  var checks = [];
  var updates = [];
  try {
    const job_type = req.body.job_type;
    const current_user = decodeMiddleware.getCurrentUser(req);
    const newStatus = status_by_jobtypes.types[job_type]["start"];

    req.body["username"] = current_user.username;
    req.body["id"] = current_user.id;

    checks.push(await jobModel.getById({ id: req.body.job }));
    checks.push(
      await jobModel.getByTakerUsername({ taker_username: req.body.username })
    );

    updates.push(
      await jobModel.setUsernameTaker({
        taker_username: req.body.username,
        job: req.body.job
      })
    );
    updates.push(await jobModel.setStartTime({ job: req.body.job }));
    updates.push(
      await jobModel.setJobStatus({ status: newStatus, job: req.body.job })
    );

    Promise.all(checks).then(function(results) {
      if (
        results[0] &&
        results[0].rows &&
        results[0].rowLength > 0 &&
        results[0].rows.filter(
          x => x && (!x.end && !x.start && !x.taker_username)
        ).length == 1
      ) {
        Promise.all(updates).then(function(result) {
          return res.status(200).json({ message: "Success." });
        });
      } else if (
        results[0] &&
        results[0].rowLength > 0 &&
        results[0].rows &&
        results[0].rows.filter(x => x.taker_username === req.body.username)
          .length >= 1
      ) {
        Promise.all([
          jobModel.setJobStatus({ status: newStatus, job: req.body.job })
        ]).then(function(result) {
          return res
            .status(200)
            .json({ message: "You already started the job." });
        });
      } else if (
        results[1] &&
        results[1].rowLength > 0 &&
        results[1].rows &&
        results[1].rows.filter(x => x && !x.end && x.start).length >= 1
      ) {
        return res.status(400).json({ message: "You already started a job." });
      } else {
      }
    });
  } catch (e) {
    return next(e);
  }
};

const complete = async (req, res, next) => {
  var checks = [];
  var updates = [];
  try {
    const job_type = req.body.job_type;
    const current_user = decodeMiddleware.getCurrentUser(req);
    const newStatus = status_by_jobtypes.types[job_type]["complete"];
    req.body["username"] = current_user.username;
    req.body["id"] = current_user.id;

    checks.push(await jobModel.getById({ id: req.body.job }));

    updates.push(await jobModel.setEndTime({ job: req.body.job }));
    updates.push(
      await jobModel.setJobStatus({ status: newStatus, job: req.body.job })
    );

    Promise.all(checks).then(function(results) {
      if (results[0] && results[0].rowLength > 0 && results[0].rows) {
        const jobs = results[0].rows;
        if (jobs.filter(x => !x.end && x.taker_username && x.start)) {
          Promise.all(updates).then(function(values) {
            //MQTTpublisher.publish(REMOVEJOB, req.body);
            return res.status(202).json({ message: "Success." });
          });
        } else if (jobs.filter(x => x.end).length > 0) {
          return res.status(400).json({ message: "Already completed." });
        } else if (jobs.filter(x => !x.start).length > 0) {
          return res.status(400).json({ message: "Job didnt start yet." });
        } else if (
          jobs.filter(x => x.taker_username !== req.body.username).length > 0
        ) {
          return res.status(400).json({
            message: "Job started by another user. You can't complete it."
          });
        } else {
        }
      }
    });
  } catch (e) {
    return next(e);
  }
};

const cancel = async (req, res, next) => {
  var checks = [];
  var updates = [];
  if (!req.body.cancel_reason) {
    return res.status(400).json({ message: "You have to pick a reason." });
  }
  try {
    const current_user = decodeMiddleware.getCurrentUser(req);
    const job_type = req.body.job_type;
    const newStatus = status_by_jobtypes.types[job_type]["cancel"];
    req.body["username"] = current_user.username;
    req.body["id"] = current_user.id;

    checks.push(await jobModel.getJobs({ id: req.body.job }));

    updates.push(
      await jobModel.setCancelReason({
        cancel_reason: req.body.cancel_reason,
        job: req.body.job
      })
    );
    updates.push(await jobModel.setEndTime({ job: req.body.job }));
    updates.push(
      await jobModel.setJobStatus({ status: newStatus, job: req.body.job })
    );

    Promise.all(checks).then(function(results) {
      if (results[0].rowLength > 0 && results[0].rows && results[0].rows[0]) {
        const job = results[0].rows[0];
        if (!job.end && job.taker_username == req.body.username && job.start) {
          var data_cancel = job;
          data_cancel["original_job_id"] = job.id;
          updates.push(jobModel.createCanceled(data_cancel));

          Promise.all(updates).then(function(values) {
            //MQTTpublisher.publish(REMOVEJOB, req.body);
            return res.status(202).json({ message: "Success." });
          });
        } else if (job.end) {
          return res.status(400).json({ message: "Job already completed." });
        } else if (!job.start) {
          return res.status(400).json({ message: "Job didnt start yet." });
        } else if (job.taker_username !== req.body.username) {
          return res.status(400).json({
            message: "Job started by another user. You can't cancel it."
          });
        } else {
        }
      }
    });
  } catch (e) {
    return next(e);
  }
};

const isAgentAvailable = async (req, res, next) => {
  try {
    const username = decodeMiddleware.getCurrentUser(req).username;
    const db_response = await jobModel.getByTakerUsername({
      taker_username: username
    });

    if (db_response && db_response.rows) {
      const jobs = db_response.rows;
      const available = jobs.filter(x => x.start && !x.end).length == 0;

      return res.status(200).json({ message: available });
    } else {
      return res.status(400).json({ message: "No." });
    }
  } catch (e) {
    return next(e);
  }
};

const currentJob = async (req, res, next) => {
  try {
    const username = decodeMiddleware.getCurrentUser(req).username;
    const db_response = await jobModel.getByTakerUsername({
      taker_username: username
    });

    if (db_response && db_response.rows) {
      const jobs = db_response.rows;
      const current_job = jobs.filter(x => x.start && !x.end);

      if (current_job.length == 0) {
        return res.status(200).json({ message: "" });
      } else {
        return res.status(200).json({ message: current_job });
      }
    } else {
      return res.status(400).json({ message: "No." });
    }
  } catch (e) {
    return next(e);
  }
};

const filterByType = (jobs, types) => {
  return jobs.filter(x => types.includes(x.job_type));
};

exports.create = create;
exports.get = get;
exports.start = start;
exports.complete = complete;
exports.cancel = cancel;
exports.history = history;
exports.getTowJobs = getTowJobs;
exports.isAgentAvailable = isAgentAvailable;
exports.currentJob = currentJob;
exports.getClamperJobs = getClamperJobs;
