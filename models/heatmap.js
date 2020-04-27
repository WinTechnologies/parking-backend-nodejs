const { Pool } = require("pg");

let client;

const configure = async function(database) {
  const pool = new Pool({
    host: "localhost", // Server hosting the postgres database
    user: "test_bryan", // env var: PGUSER
    database: database, // env var: PGDATABASE
    password: "test", // env var: PGPASSWORD
    port: 5432, // env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
  });

  client = await pool.connect();

  return client;
};

exports.get = async function(q) {
  client = await configure(
    q.database === "Jeddah"
      ? "osm_jeddah"
      : q.database === "Paris"
        ? "osm_paris"
        : "osm_gcc_states"
  );
  if (q.hour && q.min) {
    var query = `SELECT date_timestamp as date_timestamp, date_day_timestamp as date_day_timestamp, center_segment_txt, perc_time_occupation, end_segment_txt, start_segment_txt FROM ${
      q.schema
    }.city_full_transactions_dates_segments WHERE date_timestamp = TIMESTAMP '${
      q.year
    }-${q.month}-${q.day} ${q.hour}:${q.min}:00'`;
    var select = await client.query(query);
  } else {
    var query = `SELECT date_timestamp at time zone 'utc' as date_timestamp, date_day_timestamp at time zone 'utc' as date_day_timestamp, center_segment_txt, perc_time_occupation, end_segment_txt, start_segment_txt FROM ${
      q.schema
    }.city_full_transactions_dates_segments WHERE date_day_timestamp = TIMESTAMP '${
      q.year
    }-${q.month}-${q.day}'`;
    var select = await client.query(query);
  }
  client.release();
  return Promise.resolve(select.rows);
};

exports.getPredictive = async function(q) {
  client = await configure(
    q.database === "Jeddah"
      ? "osm_jeddah"
      : q.database === "Paris"
        ? "osm_paris"
        : "osm_gcc_states"
  );
  if (q.hour && q.min) {
    var query = `SELECT date_timestamp as date_timestamp, date_day_timestamp as date_day_timestamp, center_segment_txt, perc_time_occupation, end_segment_txt, start_segment_txt FROM ${
      q.schema
    }.city_predicted_transactions WHERE date_timestamp = TIMESTAMP '${q.year}-${
      q.month
    }-${q.day} ${q.hour}:${q.min}:00'`;
    var select = await client.query(query);
  } else {
    var query = `SELECT date_timestamp at time zone 'utc' as date_timestamp, date_day_timestamp at time zone 'utc' as date_day_timestamp, center_segment_txt, perc_time_occupation, end_segment_txt, start_segment_txt FROM ${
      q.schema
    }.city_predicted_transactions WHERE date_day_timestamp = TIMESTAMP '${
      q.year
    }-${q.month}-${q.day}'`;
    var select = await client.query(query);
  }
  client.release();
  return Promise.resolve(select.rows);
};

exports.getUniqueDates = async function(q) {
  client = await configure(
    q.database === "Jeddah"
      ? "osm_jeddah"
      : q.database === "Paris"
        ? "osm_paris"
        : "osm_gcc_states"
  );

  if (q.hour && q.min) {
    var query = `SELECT number_transactions FROM ${
      q.schema
    }.city_unique_dates WHERE date_timestamp = TIMESTAMP '${q.year}-${
      q.month
    }-${q.day} ${q.hour}:${q.min}:00'`;
    var select = await client.query(query);
  } else {
    var query = `SELECT number_transactions FROM ${
      q.schema
    }.city_unique_dates WHERE date_day_timestamp = TIMESTAMP '${q.year}-${
      q.month
    }-${q.day}'`;
    var select = await client.query(query);
  }
  client.release();
  return Promise.resolve(select.rows);
};

exports.getPredictiveDates = async function(q) {
  client = await configure(
    q.database === "Jeddah"
      ? "osm_jeddah"
      : q.database === "Paris"
        ? "osm_paris"
        : "osm_gcc_states"
  );
  if (q.hour && q.min) {
    var query = `SELECT number_transactions FROM ${
      q.schema
    }.city_predicted_dates WHERE date_timestamp = TIMESTAMP '${q.year}-${
      q.month
    }-${q.day} ${q.hour}:${q.min}:00'`;
    var select = await client.query(query);
  } else {
    var query = `SELECT number_transactions FROM ${
      q.schema
    }.city_predicted_dates WHERE date_day_timestamp = TIMESTAMP '${q.year}-${
      q.month
    }-${q.day}'`;
    var select = await client.query(query);
  }
  client.release();
  return Promise.resolve(select.rows);
};
