const cnService = require('../contravention/service');
const jobModel = require('./job.model');
const pgJobModel = require('../pg/job/job.model');
const jobMiddelware = require('./job.middelware');
const MQTTpublisher = require("../services/MQTT/publisher");
const { JobStatus, ActiveJobStatus, MqttSubject } = require('../contravention/constants');

const OSESLogger = require('../../helpers/mawgifLogger');

const create = async (req, res, next) => {
    // TODO: check jobMiddelware.checkRequiredFields()
    const requireFields = jobMiddelware.checkRequiredFields(req.body);
    if (requireFields.length > 0) {
        return res
            .status(400)
            .json({ message: "Missing fields : " + requireFields });
    } else {
        try {
            // TODO: check jobMiddelware.handleNullValues()
            const data = jobMiddelware.handleNullValues(req.body);
            if (!data.sent_by) {
                data.sent_by= 'OSES';
            }
            const createdJobs = await jobModel.createJob(data);
            if (!createdJobs || createdJobs.rowCount === 0) {
                return res.status(500).json({
                    message: 'Error during job creation, No job created!',
                });
            }
            const createdJob = createdJobs.rows[0];
            const { project_name, project_gmt, vat_id, violation_code, zone_name } =
                await cnService.prepareCNData(createdJob.project_id, createdJob.violation_id, createdJob.zone_id);

            createdJob['project_name'] = project_name;
            createdJob['project_gmt'] = project_gmt;
            createdJob['vat_id'] = vat_id;
            createdJob['violation_code'] = violation_code;
            createdJob['zone_name'] = zone_name;

            /**
             * Create or update ticket for new job
             * createdJob: { cn_number_offline, car_plate, plate_type,
             *      plate_country, project_id, vat_id, creator_id }
             */
            await cnService.createTickets(createdJob, null, createdJob.job_number);

            return res.status(201).json({ message: 'Job created successfully' });
        } catch (err) {
            next(err);
        }
    }
};

const createCanceled = async body => {
    try {
        var response = await jobModel.createCanceled(body);
    } catch (e) {
        next(e);
    }
};

/**
 * Start a job (CLAMP, CLAMP TO TOW, TOW, DECLAMP)
 *      /start/:job_number
 * @param req req.body:<{id(job_number), employee_id, username, job_type, date}>
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const start = async (req, res, next) => {
    if (
        !req.params.job_number
        || !req.body.employee_id
        || !req.body.username
        || !req.body.job_type
        || !req.body.date
    ) {
        return res.status(400).json({ message: 'Missing Parameters!' });
    }

    const jobNumber = req.params.job_number;
    const { job_type, employee_id, username, date: jobStartDate } = req.body;
    const openStatus = JobStatus.types[job_type]['open'];
    const startStatus = JobStatus.types[job_type]['start'];

    if (req._user.employee_id !== employee_id || req._user.username !== username) {
        return res.status(403).json({ message: 'Access denied, Driver info is not the same as currently authorized user.' });
    }

    try {
        const results = await jobModel.getByIdPg(jobNumber);
        if (!results || !results.rows || results.rowCount === 0) {
            return res.status(404).json({ message: 'Job Number Not Found!' });
        }

        const nextJob = results.rows[0];
        if (nextJob.date_start && nextJob.status === startStatus) {
            return res.status(400).json({ message: 'This job is already started!' });
        }

        if (!nextJob.date_start && !nextJob.date_end || nextJob.status === openStatus) {
            const resultByTaker = await jobModel.getByTakerPg({
                taker_id: employee_id,
                taker_username: username,
            });

            // Filter only start, active/delivery status
            const activeJob = resultByTaker.rows.filter(x =>
                x.date_start && !x.date_end && ActiveJobStatus.includes(x.status));

            if (activeJob && activeJob.length > 0) {
                return res
                    .status(400)
                    .json({ message: 'You already have an active job!' });
            }

            const updatedJob = await jobModel.updateByJobNumber({
                job_number: jobNumber,
                taker_id: employee_id,
                taker_username: username,
                date_start: jobStartDate,
                status: startStatus,
            }, employee_id);

            MQTTpublisher.client.publish(
                MqttSubject.StartedJob,
                JSON.stringify({
                    id: jobNumber,
                    job_number: jobNumber,
                    taker_id: employee_id,
                    taker_username: username,
                    date_start: jobStartDate,
                    status: startStatus,
                })
            );
            res.status(200)
                .json({ message: 'Success!', job: updatedJob.rows[0] });
        } else {
            return res
                .status(409)
                .json({ message: 'This Job is not in open status!' });
        }
    } catch (err) {
        next(err);
    }
};

/**
 * Change a job(that are already started) back to open status
 *  (CLAMP, CLAMP TO TOW, TOW, DECLAMP)
 *      /reopen/:job_number
 * @param req req.body:<{id(job_number), employee_id, username, job_type, cancel_reason, canceled_code}>
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const reopen = async (req, res, next) => {
    if (
        !req.params.job_number
        || !req.body.employee_id
        || !req.body.username
        || !req.body.job_type
        || !req.body.cancel_reason
        || !req.body.canceled_code
    ) {
        return res.status(400).json({ message: 'Missing Parameters!' });
    }

    const jobNumber = req.params.job_number;
    const { job_type, employee_id, username, cancel_reason, canceled_code } = req.body;
    const openStatus = JobStatus.types[job_type]['open'];

    if (req._user.employee_id !== employee_id || req._user.username !== username) {
        return res.status(403).json({
            message: 'Access denied, Driver info is not the same as currently authorized user!'
        });
    }

    try {
        const results = await jobModel.getByIdPg(jobNumber);
        if (!results || !results.rows || results.rowCount === 0) {
            return res.status(404).json({ message: 'Job Number Not Found!' });
        }

        const job = results.rows[0];
        if (job.taker_id !== employee_id || job.taker_username !== username) {
            return res.status(403).json({ message: 'Permission denied, You\'re not taker of this job!' });
        }
        if (!job.date_start && !job.date_end || job.status === openStatus) {
            return res.status(400).json({ message: 'This job is already opened!' });
        }

        const updatedJob = await jobModel.updateByJobNumber({
            job_number: jobNumber,
            // taker_id: null,
            // taker_username: null,
            date_start: null,
            date_end: null,
            cancel_reason: cancel_reason,
            canceled_code: canceled_code,
            canceled_by: employee_id,
            canceled_at: new Date(),
            status: openStatus,
        }, employee_id);

        MQTTpublisher.client.publish(
            MqttSubject.UpdatedJob,
            JSON.stringify({
                id: jobNumber,
                job_number: jobNumber,
                date_start: null,
                date_end: null,
                cancel_reason: cancel_reason,
                canceled_code: canceled_code,
                canceled_by: employee_id,
                canceled_at: updatedJob.rows[0].canceled_at,
                status: openStatus
            })
        );
        return res
            .status(200)
            .json({ job: updatedJob.rows[0], message: 'Success!' });
    } catch (err) {
        next(err);
    }
};

/**
 * Complete current job (CLAMP, CLAMP TO TOW, TOW, DECLAMP)
 *      /complete/:job_number
 * @param req req.body:<{id(job_number), employee_id, username, date}>
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const complete = async (req, res, next) => {
    if (
        !req.params.job_number
        || !req.body.employee_id
        || !req.body.username
        || !req.body.date
    ) {
        return res.status(400).json({ message: 'Missing Parameters!' });
    }

    const jobNumber = req.params.job_number;
    const { employee_id, username, date: jobEndDate } = req.body;

    if (req._user.employee_id !== employee_id || req._user.username !== username) {
        return res.status(403).json({ message: 'Access denied, Driver info is not the same as currently authorized user!' });
    }

    try {
        const results = await jobModel.getByIdPg(jobNumber);
        if (!results || !results.rows || results.rowCount === 0) {
            return res.status(404).json({ message: 'Job Number Not Found!' });
        }

        const job = results.rows[0];
        if (job.taker_id !== employee_id || job.taker_username !== username) {
            return res.status(403).json({ message: 'Permission denied, You\'re not taker of this job!' });
        }

        const completeStatus = JobStatus.types[job.job_type]['complete'];
        if (job.date_start && job.date_end && job.status === completeStatus) {
            return res.status(400).json({ message: 'This job is already completed!' });
        }

        // jobModel.addClampPicturesPg(req.body)
        const updatedJob = await jobModel.updateByJobNumber({
            job_number: jobNumber,
            date_end: jobEndDate,
            status: completeStatus,
        }, employee_id);

        MQTTpublisher.client.publish(
            MqttSubject.UpdatedJob,
            JSON.stringify({
                id: jobNumber,
                job_number: jobNumber,
                date_end: jobEndDate,
                status: completeStatus
            })
        );
        return res
            .status(200)
            .json({ job: updatedJob.rows[0], message: 'Success!' });
    } catch (err) {
        next(err);
    }
};

/**
 * Deliver Tow Job (Only TOW JOB)
 *  /deliver/:job_number
 * @param req req.body:<{id(job_number), employee_id, username, job_type, vehicle_codification}>
 *     job_type: 'Tow JOB'
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const deliverTowJob = async (req, res, next) => {
    if (
        !req.params.job_number
        || !req.body.employee_id
        || !req.body.username
        || !req.body.job_type
        || req.body.job_type !== 'TOW JOB'
        || !req.body.vehicle_codification
    ) {
        return res.status(400).json({ message: 'Missing Parameters!' });
    }

    const jobNumber = req.params.job_number;
    const { employee_id, username, job_type, vehicle_codification } = req.body;
    const startStatus = JobStatus.types[job_type]['start'];
    const deliveryStatus = JobStatus.types[job_type]['delivery'];

    if (req._user.employee_id !== employee_id || req._user.username !== username) {
        return res.status(403).json({ message: 'Access denied, Driver info is not the same as currently authorized user!' });
    }

    try {
        const results = await jobModel.getByIdPg(jobNumber);
        if (!results || !results.rows || results.rowCount === 0) {
            return res.status(404).json({ message: 'Job Number Not Found!' });
        }

        const job = results.rows[0];
        if (job.taker_id !== employee_id || job.taker_username !== username) {
            return res.status(403).json({ message: 'Permission denied, You\'re not taker of this job!' });
        }

        if (!job.date_start || job.status !== startStatus) {
            return res.status(400).json({ message: 'This operation can\'t be applied!' });
        }

        const updatedJob = await jobModel.updateByJobNumber({
            job_number: jobNumber,
            vehicle_codification: vehicle_codification,
            status: deliveryStatus,
        }, employee_id);
        MQTTpublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify({
            id: jobNumber,
            job_number: jobNumber,
            vehicle_codification: vehicle_codification,
            status: deliveryStatus,
        }));
        return res.status(200).json({ job: updatedJob.rows[0], message: 'Success!' });

    } catch (err) {
        next(err);
    }
};

// Driver Map: Description: Fetch all jobs from local.
const getCurrentJob = async (req, res, next) => {
    const user = req._user;
    try {
        const results = await jobModel.getByTakerPg({
            taker_id: user.employee_id,
            taker_username: user.username
        });
        if (results && results.rows && results.rows[0]) {
            const jobs = results.rows;

            const currentJob = jobs.filter(
                x =>
                    x.date_start &&
                    !x.date_end &&
                    x.status !== JobStatus.types[x.job_type].open &&
                    x.status !== JobStatus.types[x.job_type].cancel &&
                    x.status !== JobStatus.types[x.job_type].paid &&
                    x.status !== JobStatus.types[x.job_type].missed &&
                    x.status !== JobStatus.types[x.job_type].complete
            );
            if (currentJob.length === 0) {
                return res
                    .status(200)
                    .json({ job: {}, message: "No current job." });
            } else {
                return res
                    .status(200)
                    .json({ job: currentJob[0], message: "Success." });
            }
        } else {
            return res
                .status(200)
                .json({ job: {}, message: "No current job." });
        }
    } catch (err) {
        next(err);
    }
};

const getJobs = (req, res, next) => {
    jobModel
        .getJobsPg(req.query)
        .then(result => {
            return res.status(200).json(result.rows);
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
};

const getOne = (req, res, next) => {
    const id = req.params.id;
    jobModel
        .getByIdPg(id)
        .then(result => {
            if (result && result.rows && result.rows[0]) {
                return res.status(200).json(result.rows[0]);
            } else {
                return res.status(404).json({ message: "Not Found" });
            }
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
};

const getJobsByReference = (req, res, next) => {
    const reference = req.params.reference;
    jobModel
        .getJobsByReferencePg(reference)
        .then(result => {
            if (result && result.rows && result.rows[0]) {
                return res.status(200).json(result.rows[0]);
            } else {
                return res.status(200).json({});
            }
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
};

const update = async (req, res, next) => {
    try {
        const response = await pgJobModel.getAll(req.query);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Job');
            error.statusCode = 404;
            throw error;
        }
        await pgJobModel.update(req.query, req.body);
        return res.status(200).json({
            message: 'Job updated'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getPictures = (req, res, next) => {
    jobModel
        .getPicturesPg(req.params)
        .then(result => {
            if (result && result.rows && result.rows[0]) {
                return res.status(200).json(result.rows[0]);
            } else {
                return res.status(200).json({});
            }
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/*
exports.getObs = async (req, res, next) => {
  var username = req.params.username;
  if (!username) {
    return res.status(400).json({ message: "Missing Parameters!" });
  }
  try {
    // TODO delete before it.
    var results = await jobModel.getObsPg(username);
    return res.status(200).json({ message: "Success", content: results.rows });
  } catch (e) {
    return res.status(500).json({ message: "Error on getting observations." });
  }
};
*/
/*
exports.fixEventTime = async (req, res, next) => {
  var options = { prepare: true, autoPage: true };

  client
    .stream("select * from job", [], options)
    .on("readable", async function() {
      // 'readable' is emitted as soon a row is received and parsed
      var row;

      while ((row = this.read())) {

          await client.execute(
            "update job set creation = ? where id = ? ",
            [row.event_time, row.id],
            { prepare: true }
          );

      }
    })
    .on("end", function() {
      // Stream ended, there aren't any more rows
      return res.send("successfully fixed event time");
    })
    .on("error", function(err) {
      // Something went wrong: err is a response error from Cassandra
    });
};
*/

const getJobByEmployee = (req, res, next) => {
    const employee_id = req.params.employee_id;
    jobModel.getByEmployeeIdPg(employee_id)
        .then(result => {
            if (result && result.rows && result.rows) {
                return res.status(200).json({"message":"Success","content":result.rows});
            } else {
                return res.status(200).json({"message":"Success","content":['No Job available for this employee']});
            }
        })
        .catch(err => {
            return res.status(400).json({"message":"Error","content":['No Job available for this employee']});
        });
};

const getJobByNumber = async (req, res, next) => {
    try {
        const job_number = req.params.job_number;
        const response = await jobModel.getJobByNumberPg(job_number);

        return res.status(200).json({"message":"Success","content":response.rows[0]});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const updateByJobNumber = async (req, res, next) => {
    try {
        const jobNumber = parseInt(req.params.job_number);
        const updateBody = { job_number: jobNumber, ...req.body };
        const result = await jobModel.updateByJobNumber(updateBody, req._user.employee_id);
        MQTTpublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Success'});

    } catch (err) {
        OSESLogger('error', { subject: 'Update Job By Job Number ERROR', message: err.message }, req);
        next(err);
    }
};

const getJobByCarPlate = async (req, res, next) => {
    try {
        const car_plate = req.params.car_plate;
        const job_type = req.params.job_type;
        const response = await jobModel.getJobByCarPlatePg(car_plate, job_type);

        return res.status(200).json({ message: 'Success', content: response.rows[0] });
    } catch (e) {
        return res.status(400).json({ message : e.toString() });
    }
};

/**
 * Finish CLAMP, CLAMP TO TOW, TOW, DECLAMP JOB for escaped(MISSED) car
 *  (CLAMP, CLAMP TO TOW, TOW, DECLAMP)
 *      /missed/:job_number
 * @param req req.body:<{id(job_number), employee_id, username, cancel_reason, canceled_code}>
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const finishEscapeCarJob = async (req, res, next) => {
    if (
        !req.params.job_number
        || !req.body.employee_id
        || !req.body.username
        || !req.body.cancel_reason
        || !req.body.canceled_code
    ) {
        return res.status(400).json({ message: 'Missing Parameters!' });
    }

    const jobNumber = req.params.job_number;
    const { employee_id, username, cancel_reason, canceled_code } = req.body;

    if (req._user.employee_id !== employee_id || req._user.username !== username) {
        return res.status(403).json({ message: 'Access denied, Driver info is not the same as currently authorized user!' });
    }

    try {
        const results = await jobModel.getByIdPg(jobNumber);
        if (!results || !results.rows || results.rowCount === 0) {
            return res.status(404).json({ message: 'Job Number Not Found!' });
        }

        const job = results.rows[0];
        if (job.taker_id !== employee_id || job.taker_username !== username) {
            return res.status(403).json({ message: 'Permission denied, You\'re not taker of this job!' });
        }

        const startStatus = JobStatus.types[job.job_type]['start'];
        const missedStatus = JobStatus.types[job.job_type]['missed'];
        if (!job.date_start || job.status !== startStatus) {
            return res.status(400).json({ message: 'This operation can\'t be applied!' });
        }

        const updatedJob = await jobModel.updateByJobNumber({
            job_number: jobNumber,
            cancel_reason: cancel_reason,
            canceled_code: canceled_code,
            canceled_by: employee_id,
            canceled_at: new Date(),
            status: missedStatus,
        }, employee_id);

        MQTTpublisher.client.publish(
            MqttSubject.UpdatedJob,
            JSON.stringify({
                id: jobNumber,
                job_number: jobNumber,
                cancel_reason: cancel_reason,
                canceled_code: canceled_code,
                canceled_by: employee_id,
                canceled_at: updatedJob.rows[0].canceled_at,
                status: missedStatus,
            })
        );
        return res
            .status(200)
            .json({ job: updatedJob.rows[0], message: 'Success!' });
    } catch (err) {
        next(err);
    }
};

const getJobByCnNumberOffline = async (req, res, next) => {
    try {
        const cnNumberOffline = req.params.cn_number_offline;
        const response = await jobModel.getJobByCnNumberOffline(cnNumberOffline);

        return res.status(200).json({ message: 'Success', content: response.rows[0]});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getJobByCnNumber = async (req, res, next) => {
    try {
        const cnNumber = req.params.cn_number;
        const response = await jobModel.getJobByCnNumber(cnNumber);

        return res.status(200).json({"message":"Success","content":response.rows[0]});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getUnpaidJob = async (req, res, next) => {
    try {
        const params = req.params;
        const response = await jobModel.getUnpaidJob(params);

        return res.status(200).json({ message: 'Success', content: response.rows });
    } catch (err) {
        next(err);
    }
};

const getJobByClampedStatus = async (req, res, next) => {
    try {
        const params = req.params;
        const response = await jobModel.getJobByClampedStatus(params);
        return res.status(200).json({ message: 'Success', content: response.rows });
    } catch (err) {
        next(err);
    }
};

const getJobByDeClampStatus = async (req, res, next) => {
    try {
        const params = req.params;
        const response = await jobModel.getJobByDeClampStatus(params);
        return res.status(200).json(response.rows);
    } catch (err) {
        next(err);
    }
};

const updateClampPicturesByJobNumber = async (req, res, next) => {
    try {
        const jobNumber = parseInt(req.params.job_number);
        const body = {
            job_number: jobNumber,
            ...req.body
        };
        const result = await jobModel.updateClampPicturesByJobNumber(body);
        MQTTpublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Success'});
    } catch (err) {
        OSESLogger('error', { subject: 'Update the Job Clamp Pictures By Job Number ERROR', message: err.message }, req);
        next(err);
    }
};

const updateDeclampPicturesByJobNumber = async (req, res, next) => {
    try {
        const jobNumber = parseInt(req.params.job_number);
        const body = {
            job_number: jobNumber,
            ...req.body
        };
        const result = await jobModel.updateDeclampPicturesByJobNumber(body);
        MQTTpublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Success'});
    } catch (err) {
        OSESLogger('error', { subject: 'Update the Job Declamp Pictures By Job Number ERROR', message: err.message }, req);
        next(err);
    }
};

const updateTowPicturesByJobNumber = async (req, res, next) => {
    try {
        const jobNumber = parseInt(req.params.job_number);
        const body = {
            job_number: jobNumber,
            ...req.body
        };
        const result = await jobModel.updateTowPicturesByJobNumber(body);
        MQTTpublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Success'});
    } catch (err) {
        OSESLogger('error', { subject: 'Update the Job Tow Pictures By Job Number ERROR', message: err.message }, req);
        next(err);
    }
};

const updateDefectPicturesByJobNumber = async (req, res, next) => {
    try {
        const jobNumber = parseInt(req.params.job_number);
        const body = {
            job_number: jobNumber,
            defect_infos: req.body
        };

        const result = await jobModel.updateDefectPicturesByJobNumber(body);
        MQTTpublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Success'});
    } catch (err) {
        OSESLogger('error', { subject: 'Update the Job Defect Pictures By Job Number ERROR', message: err.message }, req);
        next(err);
    }
};

const getJobByBarcode = async (req, res, next) => {
    try {
        const params = req.params;
        const response = await jobModel.getJobByBarcode(params);
        return res.status(200).json({ message: 'Success', content: response.rows });
    } catch (err) {
        next(err);
    }
};


const updateClampBarCode = async (req, res, next) => {
    try {
        const jobNumber = parseInt(req.params.job_number);
        const body = {
            job_number: jobNumber,
            clamp_barcode: req.body.clamp_barcode
        };

        const result = await jobModel.updateClampBarCode(body);
        MQTTpublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify(result.rows[0]));
        return res.status(200).json({ message: 'Success'});
    } catch (err) {
        OSESLogger('error', { subject: 'Update the Job Clamp Barcode By Job Number ERROR', message: err.message }, req);
        next(err);
    }
};

exports.create = create;
exports.getOne = getOne;
exports.getJobsByReference = getJobsByReference;
exports.update = update;
exports.createCanceled = createCanceled;
exports.reopen = reopen;
exports.start = start;
exports.complete = complete;
exports.getCurrentJob = getCurrentJob;
exports.getPictures = getPictures;
exports.getJobs = getJobs;
exports.deliverTowJob = deliverTowJob;
exports.getJobByEmployee = getJobByEmployee;
exports.getJobByNumber = getJobByNumber;
exports.updateByJobNumber = updateByJobNumber;
exports.getJobByCarPlate = getJobByCarPlate;
exports.finishEscapeCarJob = finishEscapeCarJob;
exports.getJobByCnNumberOffline = getJobByCnNumberOffline;
exports.getJobByBarcode = getJobByBarcode;
exports.getJobByCnNumber = getJobByCnNumber;
exports.getUnpaidJob = getUnpaidJob;
exports.getJobByClampedStatus = getJobByClampedStatus;
exports.getJobByDeClampStatus = getJobByDeClampStatus;
exports.updateClampPicturesByJobNumber = updateClampPicturesByJobNumber;
exports.updateDeclampPicturesByJobNumber = updateDeclampPicturesByJobNumber;
exports.updateTowPicturesByJobNumber = updateTowPicturesByJobNumber;
exports.updateDefectPicturesByJobNumber = updateDefectPicturesByJobNumber;
exports.updateClampBarCode = updateClampBarCode;
