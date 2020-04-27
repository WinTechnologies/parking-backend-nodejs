var client = require('../helpers/cassandraClient');

exports.create = function(values) {
    var queryStr = "insert into stats_prefs (id, chart_title, username, chart_type, chart_x, chart_y, x_type, y_type, periode, function) values (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    var list_values = [values.chart_title, values.username, values.chart_type, values.chart_x, values.chart_y, values.x_type, values.y_type, values.periode, values.function];
    return client.execute(queryStr, list_values);
};

exports.get = function(values) {
    if(values.id) {
        var query = "select * from stats_prefs where id = ?";
        return client.execute(query, [values.id]);
    } else if(values.name) {
        var query = "select * from stats_prefs where username = ? ALLOW FILTERING";
        return client.execute(query, [values.username]);
    } else {
        var query = "select * from stats_prefs";
        return client.execute(query);
    }
};

exports.getByUser = function(values) {
  if(values.chart_title && values.chart_title === 'null') values.chart_title = null;
    if(values.id) {
        var query = "select * from stats_prefs where id = ?";
        return client.execute(query, [values.id]);
    } else if(values.username && values.chart_title) {
        var query = "select * from stats_prefs where username = ? and chart_title = ? ALLOW FILTERING";
        return client.execute(query, [values.username, values.chart_title]);
    } else if(values.username) {
        var query = "select * from stats_prefs where username = ? ALLOW FILTERING";
        return client.execute(query, [values.username]);
    } else {
        var query = "select * from stats_prefs";
        return client.execute(query);
    }
};

exports.update = function(body) {
    var updates = [];
    for(var field in body){
        if(body[field] && field != 'id'){
            updates.push(client.execute("update stats_prefs set "+field+" = ? where id = ?", [body[field], body.id]));
        }
    }
    return Promise.all(updates);
};

exports.delete = function(id) {
    var query = "delete from stats_prefs where id = ?";
    return client.execute(query, [id]);
};

exports.getUserParam = function(params){
  let result = {};
  switch(params.usertype){
    case 'Driver':
      result = getDriverChartParam();
      break;
    case 'Clamper':
      result = getClamperChartParam();
      break;
    case 'Enforcer':
      result = getEnforcerChartParam();
      break;
    default:
      break;
  }
  return result;
}


function getDriverChartParam(){
  return { rows: [
      { chart_title: 'Job amount per date', chart_type: 'multiBarChart', chart_x: 'date_transaction', chart_y: 'price_transaction', x_type: 'Date', y_type: 'Number', periode: 'day', multi: true },
      { chart_title: 'Number of jobs per date', chart_type: 'lineWithFocusChart', chart_x: 'date_transaction', chart_y: 'nb_jobs', x_type: 'Date', y_type: 'Number', periode: 'day', multi: true },
      { chart_title: 'Number of jobs group by car plate type', chart_type: 'Pie', chart_x: 'car_plate', chart_y: 'nb_jobs', x_type: 'String', y_type: 'Number', periode: 'day', multi: false },
      { chart_title: 'Number of jobs group by site', chart_type: 'Pie', chart_x: 'site_id', chart_y: 'nb_jobs', x_type: 'String', y_type: 'Number', periode: 'day', multi: false }
  ]};
}

function getClamperChartParam(){
  return { rows: [
    { chart_title: 'Job amount per date', chart_type: 'multiBarChart', chart_x: 'date_transaction', chart_y: 'price_transaction', x_type: 'Date', y_type: 'Number', periode: 'day', multi: true },
    { chart_title: 'Number of jobs per date', chart_type: 'lineWithFocusChart', chart_x: 'date_transaction', chart_y: 'nb_jobs', x_type: 'Date', y_type: 'Number', periode: 'day', multi: true },
    { chart_title: 'Number of jobs group by car plate type', chart_type: 'Pie', chart_x: 'car_plate', chart_y: 'nb_jobs', x_type: 'String', y_type: 'Number', periode: 'day', multi: false },
    { chart_title: 'Number of jobs group by site', chart_type: 'Pie', chart_x: 'site_id', chart_y: 'nb_jobs', x_type: 'String', y_type: 'Number', periode: 'day', multi: false }
  ]};
}

function getEnforcerChartParam(){
  return { rows: [
      { chart_title: 'Violation amount per date', chart_type: 'multiBarChart', chart_x: 'date_transaction', chart_y: 'price_transaction', x_type: 'Date', y_type: 'Number', periode: 'day', multi: true },
      { chart_title: 'Number of contraventions per date', chart_type: 'lineWithFocusChart', chart_x: 'date_transaction', chart_y: 'nb_contraventions', x_type: 'Date', y_type: 'Number', periode: 'day', multi: true },
      { chart_title: 'Number of contraventions group by car plate type', chart_type: 'Pie', chart_x: 'car_plate', chart_y: 'nb_contraventions', x_type: 'String', y_type: 'Number', periode: 'day', multi: false },
      { chart_title: 'Number of contraventions group by violation', chart_type: 'Pie', chart_x: 'violation_id', chart_y: 'nb_contraventions', x_type: 'String', y_type: 'Number', periode: 'day', multi: false },
  ]};
}
