var client = require("../helpers/cassandraClient");
var stats_calc = require("../statistics/calculation");

exports.create = function(values) {
  var query =
    "insert into contraventions (id, date, employee_id, employee_name, site_id, vehicle_id, vehicle_type, money_amount) " +
    "values (uuid(), ?, ?, ?, ?, ?, ?, ?)";
  return client.execute(query, [
    values.date,
    values.employee_id,
    values.employee_name,
    values.site_id,
    values.vehicle_id,
    values.vehicle_type,
    values.money_amount
  ]);
};

function getAxis() {
  return {
    rows: [
      {
        name: "price_transaction",
        label: "Price",
        type: "Number",
        x_enabled: true,
        y_enabled: true
      },
      {
        name: "nb_contraventions",
        label: "Number of contraventions",
        type: "Number",
        x_enabled: false,
        y_enabled: true
      },
      {
        name: "date_transaction",
        label: "Date",
        type: "Date",
        x_enabled: true,
        y_enabled: false
      },
      {
        name: "name_employe",
        label: "Employee",
        type: "String",
        x_enabled: true,
        y_enabled: false
      },
      {
        name: "nb_jobs",
        label: "Number of jobs",
        type: "Number",
        x_enabled: false,
        y_enabled: true
      },
      {
        name: "price_job",
        label: "Job amount",
        type: "Number",
        x_enabled: false,
        y_enabled: true
      }
    ]
  };
}

function getContraventions(params) {
  // IN operator for non-primary key is not allowed in CQL
  // So execute script for each site in given project and merge it
  if (params.project && !params.site) {
    return get_by_project(params);
  }

  // Prepare query string and parameters
  let query = "select * from " + "contraventions";
  let queryParams = [];
  if (params) {
    // Compare from date
    if ("site" in params) queryParams.push("site_id = " + params["site"]);
    if ("vehicle_type" in params)
      queryParams.push("vehicle_type = '" + params["vehicle_type"] + "'");
    if ("from" in params)
      queryParams.push("date >= '" + (params["from"] + " 00:00:00") + "'");
    if ("to" in params)
      queryParams.push("date <= '" + (params["to"] + " 23:59:59") + "'");
    if ("creator_username" in params)
      queryParams.push(
        "creator_username = '" + params["creator_username"] + "'"
      );
  }
  if (queryParams.length > 0)
    query += " where " + queryParams.join(" and ") + " ALLOW FILTERING";

  return client.execute(query);
}

const get_by_project = async params => {
  return new Promise((resolve, reject) => {
    let query =
      "select * from site where project_id = " +
      params.project +
      " allow filtering";
    client
      .execute(query)
      .then(result => {
        let params2 = params;
        let contraventions = [],
          queries = [];
        for (let site of result.rows) {
          params2.site = site.id;
          queries.push(getContraventions(params2));
        }

        Promise.all(queries).then(function(values) {
          for (let value of values)
            contraventions = contraventions.concat(value.rows);

          // Return as cql resultset
          resolve({ rows: contraventions });
        });
      })
      .catch(e => reject(e));
  });
};

exports.get = getContraventions;

exports.getAxis = getAxis;
