const postgresClient = require('../../../helpers/postgresClient');

const TABLE_ASSET = "asset_2";
const TABLE_MODEL = "asset_model_2";
const TABLE_TYPE = "asset_type_2";

exports.getByProject = function (params) {
  var query = `SELECT codification_id as id, model_id, codification_id, project_id, vehicle_plate, vehicle_brand, vehicle_plate_ar, vehicle_brand_ar, status_vehicle, t.code as type_asset, m.name as model_name
       FROM ${TABLE_ASSET}
       LEFT JOIN ${TABLE_MODEL} m on asset_2.model_id = m.id
       LEFT JOIN ${TABLE_TYPE} t on m.type_id = t.id
       WHERE `;
  var subQuery = `SELECT model.id FROM ${TABLE_MODEL} AS model LEFT JOIN ${TABLE_TYPE} AS type on type.id = model.type_id WHERE `;

  if(params.type_asset && params.type_asset === "Van") {
    subQuery += "type.code='Van'";
  } else if(params.type_asset && params.type_asset === "Truck") {
    subQuery += "type.code='Truck'";
  } else {
    subQuery += "(type.code='Truck' or type.code='Van')";
  }

  query += `model_id IN (${subQuery})`;

  query += ` AND status_vehicle='Available' and project_id= $1`;
  return postgresClient.query(query, [params.projectId]);
};

exports.assignTowTruck = function (params) {
  var query = `UPDATE ${TABLE_ASSET} SET status_vehicle = 'Active' WHERE codification_id=$1`;
  return postgresClient.query(query,[params.asset.codification_id]);
};

exports.unAssignTowTruck = function (params) {
  var query = `UPDATE ${TABLE_ASSET} SET status_vehicle = 'Available' WHERE codification_id=$1`;
  return postgresClient.query(query,[params.asset.codification_id]);
};

exports.getAll = function(query) {
  let queryString;
  if (query.id) {
    queryString = `SELECT * FROM ${TABLE_ASSET} as asset
                  LEFT JOIN ${TABLE_MODEL} m on asset.model_id = m.id
                  LEFT JOIN ${TABLE_TYPE} t on m.type_id = t.id
                  WHERE asset.codification_id = $1 and (t.code='Truck' or t.code='Van')`;
    return postgresClient.query(queryString, [query.id]);
  } else {
    queryString = `SELECT * from ${TABLE_ASSET}
                    LEFT JOIN ${TABLE_MODEL} m on asset_2.model_id = m.id
                    LEFT JOIN ${TABLE_TYPE} t on m.type_id = t.id
                    WHERE t.code='Truck' OR t.code='Van'`;
    return postgresClient.query(queryString);
  }
};