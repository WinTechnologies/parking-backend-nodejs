var client = require("../helpers/cassandraClient");
var jobModel = require("../api/jobs/job.model");

const STATUS = "MISSED";
const HOUR_LIMIT = 20;
const OPEN_STATUS = "Open";
const TABLE_NAME = "job";

module.exports = async () => {
  // var jobs = await jobModel.getJobs({status: OPEN_STATUS});
  // var queries = [];
  // jobs.forEach(function(value) {
  //   if (value.status === OPEN_STATUS) {
  //     var jobDate = new Date(Date.parse(value.creation));
  //     var today = new Date(Date.now());
  //
  //     var query =
  //       "UPDATE " + TABLE_NAME + " SET status = '" + STATUS + "' WHERE id = ?";
  //
  //     if (
  //       (today.getMonth() === jobDate.getMonth() &&
  //         today.getDate() > jobDate.getDate()) ||
  //       today.getMonth() > jobDate.getMonth() ||
  //       (today.getDate() === jobDate.getDate() &&
  //         jobDate.getHours() < HOUR_LIMIT &&
  //         today.getHours() > HOUR_LIMIT)
  //     ) {
  //       queries.push({ query: query, params: [value.id] });
  //     }
  //   }
  // });
  //
  // if (queries.length > 0) {
  //   try {
  //       var i,j,temparray,chunk = 500;
  //       for (i=0,j=queries.length; i<j; i+=chunk) {
  //           temparray = queries.slice(i,i+chunk);
  //           // do whatever
  //           var result = await client.batch(temparray, { prepare: true });
  //           console.log("MISSED JOBS: " + temparray.length);
  //       }
  //
  //   } catch (e) {
  //
  //       console.log("cleanDB: ", e.toString() );
  //   }
  // }
};
