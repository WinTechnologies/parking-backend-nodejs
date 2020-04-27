var stats_prefsModel = require('../models/stats_prefs');
var contraventions = require('../models/contraventions');

const create = async (req, res, next) => {
    try{
        var response = (await stats_prefsModel.create(req.body));
    }catch (e){
        return next(e);
    }
    return res.status(201).json(response.rows);
};

const get = async (req, res, next) => {
    try{
        var response = (await stats_prefsModel.get(req.query));
    }catch (e){
        return next(e);
    }
    return res.status(200).json(response.rows);
};

const getByUser = async (req, res, next) => {
    try{
        var response = (await stats_prefsModel.getByUser(req.query));
    }catch (e){
        return next(e);
    }
    return res.status(200).json(response.rows);
};

const update = async (req, res, next) => {
    try {
        var response = (await stats_prefsModel.update(req.body));
    }catch (e) {
        return next(e);
    }
    return res.status(202).json(response.rows);
};

const del = async (req, res, next) => {
    try{
        var checkIfChartExist = (await stats_prefsModel.get(req.query));
    } catch(e) {
        return next(e);
    }
    if (checkIfChartExist && checkIfChartExist.rowLength > 0){
        try {
            var response = (await stats_prefsModel.delete(req.query.id));
        } catch (e) {
            return next(e);
        }
        return res.status(202).json({message: 'deleted'});
    } else {
        return res.status(202).json({error: 'Invalid chart data.'});
    }
};

const getAxis = async (req, res, next) => {
    try{
        var response = contraventions.getAxis();
    }catch (e){
        return next(e);
    }
    return res.status(200).json(response.rows);
};

const getParamChart = async(req, res, next) => {
  try {
    var response = await stats_prefsModel.getUserParam(req.params);
    return res.status(200).json(response.rows);
  } catch (e){
      return next(e);
  }
};

exports.create = create;
exports.get = get;
exports.getByUser = getByUser;
exports.getParamChart= getParamChart;
exports.update = update;
exports.del = del;
exports.getAxis = getAxis;
