var teamModel = require('../models/team');
var async = require('async');

const create = async (req, res, next) => {
    try{
        var response = (await teamModel.create(req.body));
    }catch (e){
        return next(e);
    }
    return res.status(201).json(response);
};

const get = (req, res, next) => {
    teamModel.get(req.query).then(teams => {
        teams.rows = teams.rows || [];
        if (req.query.project_id) {
            teams.rows = teams.rows.filter(item => {
                item.project_id = item.project_id || '';
                return item.project_id.toString() === req.query.project_id.toString();
            })
        }
        return res.status(200).json(teams.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const update = async (req, res, next) => {
    try {
        checkIfExist = (await teamModel.get(req.body));
    }catch(e){
        return next(e);
    }
    if(checkIfExist && checkIfExist.rowLength > 0){
        try {
            var response = (await teamModel.update(req.body));
        }catch (e) {
            return next(e);
        }
        return res.status(202).json({message: 'success.'});
    }
    return res.status(202).json({error: 'Invalid team data.'});
};

const updateBulk = async (req, res, next) => {
    if (req.body && req.body.length) {
        async.each(req.body, (team, callback) => {
            teamModel.update(team).then(result => {
                callback();
            });
        }, function(err) {
            return res.status(202).json({message: 'success.'});
        });

    }
};

const del = async (req, res, next) => {
    try {
        checkIfExist = (await teamModel.get(req.query));
    }catch(e){
        return next(e);
    }
    if(checkIfExist && checkIfExist.rowLength > 0){
        try {
            var response = (await teamModel.delete(req.query.id));
        } catch (e) {
            return next(e);
        }
        return res.status(202).json({message: 'success.'});
    }
    return res.status(202).json({error: 'Invalid team data.'});
};

exports.create = create;
exports.get = get;
exports.update = update;
exports.updateBulk = updateBulk;
exports.del = del;