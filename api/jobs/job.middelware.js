const jobModel = require("./job.model");

const fields = [
  "address_simplified",
  "cancel_reason",
  "car_brand",
  "car_color",
  "car_plate",
  "car_pound_id",
  "creator_username",
  "creator_id",
  "custom_job_description",
  "date_end",
  "job_type",
  "latitude",
  "longitude",
  "payment_id",
  "violation_pictures",
  "project_id",
  "project_name",
  "related_clamp_job_id",
  "date_start",
  "status",
  "taker_username",
  "taker_id",
  "zone_id",
  "zone_name"
];
const require_fields = [
  "car_brand",
  "car_color",
  "car_plate",
  "job_type",
  "latitude",
  "longitude",
  "project_name",
  "project_id",
  "zone_id"
];
const numerical_fields = ["latitude", "longitude"];

exports.checkRequiredFields = values => {
  const valuesFields = Object.keys(values);
  const diffFields = diff(require_fields, valuesFields);
  return diffFields;
};

exports.requireFields = () => {
  return require_fields;
};

exports.handleNullValues = values => {
  const valuesFields = Object.keys(values);
  const nullValues = diff(fields, valuesFields);
  nullValues.forEach(x => {
    if (numerical_fields.includes(x)) {
      values[x] = 0;
    } else {
      values[x] = "";
    }
  });
  return values;
};

exports.to_cancelsJobs = async job_id => {
  const job = await jobModel.getById(job_id);
};

const diff = (array1, array2) => {
  return array1.filter(function(i) {
    return array2.indexOf(i) === -1;
  });
};
