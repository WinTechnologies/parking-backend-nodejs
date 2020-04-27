const express = require('express');
const compression = require('compression');
const logger = require('morgan');
const bodyParser = require('body-parser');
// const passport = require('passport');
const cors = require('cors');
const path = require('path');
const device = require('express-device');

// const users = require('./routes/users');
// const authenticate = require('./routes/authenticate');
// const zones = require('./routes/zone');
const parking_meters = require('./routes/parking_meter');
// const sites = require('./routes/site');
const team = require('./routes/team');
const stats_prefs = require('./routes/stats_prefs');
const routerProducts = require('./routes/products');
// const usertype = require('./routes/usertype');
const upload = require('./routes/upload');
// const project = require('./routes/project');
// const accessRights = require('./routes/accessRights');
const violations = require('./routes/violation');
// const violations_assignment = require('./routes/violation-assignment');
// const escalation = require('./routes/escalation');
// const heatmap = require('./routes/heatmap');

// const mobileLogin = require('./routes/mobile/login');
const mobilePosition = require('./routes/mobile/position');
// const setTowPlate = require('./routes/mobile/setTowPlate');

const grphHpprService = require('./api/services/graphhopper/route');

const contravention = require('./api/contravention/route');
// const pkmeter_transactions = require('./api/pkmeter_transactions/route');

// const brands = require('./api/res/brands.route');
// const models = require('./api/res/models.route');
// const violations = require('./api/res/violations.route');

const car_pound = require('./api/car_pound/route');

const jobs = require('./api/jobs/job.route');
const services = require('./api/pg/services/route');
const schedule = require('node-schedule');
const token = require('./api/pg/token-config/route');
const log_metadata = require('./api/pg/log-metadata/route');
const hhd_tracking = require('./api/pg/hhd-tracking/route');
const list_enforcer_status = require('./api/pg/list-enforcer-status/route');

const list_job_action = require('./api/pg/list-job-action/route');
const list_job_cancallation_reason = require('./api/pg/list-job-cancellation-reason/route');

const alert_accident = require('./api/pg/alert-accident/route');
const list_defect = require('./api/pg/list-defect/route');

const ftp = require('./routes/ftp');
const vehicle_plate_type = require('./api/pg/vehicle-plate-type/vehicle-plate-type.route');
const cn_review = require('./api/pg/cn-review/cn-review.route');
const cn_challenge = require('./api/pg/cn-challenge/cn-challenge.route');

const app = express();
app.use(compression());
app.use(cors());
app.use(device.capture());
app.use(logger('dev'));
app.use('/api/resource', express.static(path.join(__dirname, 'resource')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/logs', express.static(path.join(__dirname, 'logs')));


app.use(bodyParser.json({ limit: '1200kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// passport middleware
// app.use(passport.initialize());
// app.use(passport.session());
//
// require("./config/passport")(passport);

// app.use('/api/users', users);
app.use('/api/jobs', jobs);
// app.use('/api/zones', zones);
app.use('/api/parking_meters', parking_meters);
// app.use('/api/sites', sites);
app.use('/api/teams', team);
app.use('/api/stats', stats_prefs);
// app.use('/api/usertypes', usertype);
app.use('/api/upload', upload);
// app.use('/api/projects', project);
// app.use('/api/logs', require('./api/androidlogs/logs.controller'));
// app.use('/api/accessRights', accessRights);
app.use('/api/violations', violations);
// app.use('/api/violation-assignment', violations_assignment);
app.use('/api/products', routerProducts);
app.use('/api/countries', require('./routes/countries'));
// app.use('/api/escalation', escalation);
// app.use('/api/pkmeter_transactions', pkmeter_transactions);

app.use('/api/heatmap', require('./api/heatmap/heatmap.route'));
// app.use('/api/assets/barrier', require('./api/assets/barrier/barrier.route'));
// app.use('/api/assets/fixedAnpr', require('./api/assets/fixedAnpr/fixedAnpr.route'));
// app.use('/api/assets/pAndD', require('./api/assets/pAndD/pAndD.route'));
// app.use('/api/assets/rfid', require('./api/assets/rfid/rfid.route'));
// app.use('/api/assets/ticketDispenser', require('./api/assets/ticketDispenser/ticketDispenser.route'));
// app.use('/api/assets/ticketVerifier', require('./api/assets/ticketVerifier/ticketVerifier.route'));
app.use('/api/assets/towVehicule', require('./api/assets/towVehicule/towVehicule.route'));
// app.use('/api/assets/tvm', require('./api/assets/tvm/tvm.route'));

// app.use('/api/assets/manufacturer', require('./api/assets/template/manufacturer/manufacturer.route'));
// app.use('/api/assets/supplier', require('./api/assets/template/supplier/supplier.route'));
// app.use('/api/assets/model', require('./api/assets/template/model/model.route'));

// app.use('/api/tiles', require('./routes/tiles'));

// app.use('/api/client/client', require('./api/client/client/client.route'));
// app.use('/api/client/membership', require('./api/client/membership/membership.route'));
// app.use('/api/client/vehicle', require('./api/client/vehicle/vehicle.route'));
// app.use('/api/client/vehicle-brand', require('./api/client/vehicle/vehicle-brand.route'));
// app.use('/api/client/vehicle-color', require('./api/client/vehicle/vehicle-color.route'));
// app.use('/api/client/vehicle-type', require('./api/client/vehicle/vehicle-type.route'));

// app.use('/api/dashboard/job-kpi', require('./api/dashboard/job-kpi/job-kpi.route'));
// app.use('/api/dashboard/contravention-kpi', require('./api/dashboard/contravention-kpi/contravention-kpi.route'));


// app.use('/m', mobileLogin);
app.use('/m', mobilePosition);
// app.use('/m/chooseTowPlate', setTowPlate);


app.use('/api/route', grphHpprService);

app.use('/api/contravention', contravention);


// app.use('/api/brands', brands);
// app.use('/api/models', models);
// app.use('/api/violations', violations);
// app.use('/api/incidents', require('./api/incident/incident.route'));

app.use('/api/car_pound', car_pound);

// postgres routes
app.use('/api/auth', require('./api/pg/auth/auth.route'));
app.use('/api/pg/assets', require('./api/pg/assets/assets.route'));
app.use('/api/pg/employees', require('./api/pg/employees/employees.route'));
app.use('/api/pg/workplans', require('./api/pg/workplans/workplans.route'));
app.use('/api/pg/reoccurings', require('./api/pg/reoccurings/reoccurings.route'));
app.use('/api/pg/exceptions', require('./api/pg/exceptions/exceptions.route'));
app.use('/api/pg/notes', require('./api/pg/notes/notes.route'));
app.use('/api/pg/employee-wp', require('./api/pg/employee-wp/employee_wp.route'));
app.use('/api/pg/projects', require('./api/pg/projects/projects.route'));
app.use('/api/pg/clients', require('./api/pg/clients/clients.route'));
app.use('/api/pg/keydates', require('./api/pg/keydates/keydates.route'));
app.use('/api/pg/act-enforcement-incentive', require('./api/pg/act_enforcement_incentive/act_enforcement_incentive.route'));
app.use('/api/pg/act-enforcement-incentive-band', require('./api/pg/act_enforcement_incentive_band/act_enforcement_incentive_band.route'));
app.use('/api/pg/act-enforcement-prediction', require('./api/pg/act_enforcement_prediction/act_enforcement_prediction.route'));
app.use('/api/pg/project-activity', require('./api/pg/project_activity/project_activity.route'));
app.use('/api/pg/org-chart', require('./api/pg/org-chart/route'));
app.use('/api/pg/contravention', require('./api/pg/contravention/contravention.route'));
app.use('/api/pg/job', require('./api/pg/job/job.route'));
app.use('/api/pg/violation', require('./api/pg/violation/violation.route'));
app.use('/api/pg/list-type-note', require('./api/pg/list_type_note/list_type_note.route'));
app.use('/api/pg/list-city', require('./api/pg/list_city/list_city.route'));
app.use('/api/pg/asset-type', require('./api/pg/asset-type/asset-type.route'));
app.use('/api/pg/mat-table-definition', require('./api/pg/mat_table_definition/mat_table_definition.route'));

app.use('/api/pg/project-employee', require('./api/pg/project_employee/project_employee.route'));
app.use('/api/pg/assets-models', require('./api/pg/assets-models/assets-models.route'));
app.use('/api/pg/widgets', require('./api/pg/widgets/widgets.route'));
app.use('/api/pg/parkings', require('./api/pg/parkings/parkings.route'));
app.use('/api/pg/project-zones', require('./api/pg/project_zone/project_zone.route'));
app.use('/api/pg/project-terminal', require('./api/pg/project-terminal/project-terminal.route'));
app.use('/api/pg/carpark-gates', require('./api/pg/carpark-gates/carpark-gates.route'));
app.use('/api/pg/carpark-lanes', require('./api/pg/carpark-lanes/carpark-lanes.route'));
app.use('/api/pg/carpark-assets', require('./api/pg/carpark-assets/carpark-assets.route'));
app.use('/api/pg/park-space', require('./api/pg/park-space/park-space.route'));
app.use('/api/pg/project-openlands', require('./api/pg/project_openland/project_openland.route'));
app.use('/api/pg/analytics', require('./api/pg/analytics/analytics.route'));
app.use('/api/pg/performance', require('./api/pg/performance/performance.route'));

app.use('/api/pg/project-routes', require('./api/pg/project_route/project_route.route'));

app.use('/api/pg/tariff-service', require('./api/pg/tariff-service/tariff-service.route'));
app.use('/api/pg/tariff-bundle', require('./api/pg/tariff-bundle/tariff-bundle.route'));
app.use('/api/pg/tariff-bundle-service', require('./api/pg/tariff-bundle-service/tariff-bundle-service.route'));
app.use('/api/pg/tariff-interval', require('./api/pg/tariff_interval/tariff_interval.route'));
app.use('/api/pg/tariff-segment', require('./api/pg/tariff_segment/tariff_segment.route'));
app.use('/api/pg/promotions', require('./api/pg/promotion/promotion.route'));

app.use('/api/pg/groups', require('./api/pg/groups'));
app.use('/api/pg/escalations', require('./api/pg/escalations/escalations.route'));
app.use('/api/pg/vat', require('./api/pg/vat/vat.route'));
app.use('/api/pg/default-values', require('./api/pg/default-values/default-values.route'));
app.use('/api/pg/fleet-data', require('./api/pg/fleet_data/fleet_data.route'));
app.use('/api/pg/cashier-ticket', require('./api/pg/cashier-ticket/cashier-ticket.route'));
app.use('/api/pg/alert-incident', require('./api/pg/alert-incident/alert-incident.route'));

app.use('/api/pg/carparks', require('./api/pg/carparks/carparks.route'));
app.use('/api/pg/carpark-levels', require('./api/pg/carpark-levels/carpark-levels.route'));
app.use('/api/pg/carpark-zones', require('./api/pg/carpark-zones/carpark-zones.route'));

// Frontend Admin section - Permission Feature, Type, Template and employee permission
app.use('/api/pg/admin', require('./api/pg/admin'));

/**
 - Vehicle color
 - Vehicle Make
 - vehicle model
 - Vehicle type.
 */
app.use('/api/pg/vehicle', require('./api/pg/vehicle/vehicle.route'));

app.use('/api/pg/token-config', token);
// TODO: change to /api/pg/services and inform clients
app.use('/api/services', services);
app.use('/api/pg/log-metadata', log_metadata);
app.use('/api/pg/hhd-tracking', hhd_tracking);
app.use('/api/pg/list-enforcer-status', list_enforcer_status);

app.use('/api/pg/list-job-action', list_job_action);
app.use('/api/pg/list-job-cancellation-reason', list_job_cancallation_reason);

app.use('/api/pg/alert-accident', alert_accident);
app.use('/api/pg/list-defect', list_defect);
// OSES image delivery API via FTP
app.use('/api/ftp', ftp);

app.use('/api/pg/vehicle-plate-type', vehicle_plate_type);
app.use('/api/pg/cn-review', cn_review);
app.use('/api/pg/cn-challenge', cn_challenge);

// error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    // res.locals.error = req.app.get('env') === 'development' ? { message: err.message } : {};
    res.locals.error = { message: err.message };
    res.status(err.status || 500).send({ message: err.message });
});

module.exports = app;
