'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

const {
    PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT, CONFIG,
} = require('../../../config/postgres');

const models = {};

const sqInstance = new Sequelize(PGDATABASE, PGUSER, PGPASSWORD, CONFIG);

// check if the connection is ok
sqInstance
    .authenticate()
    .then(() => {
        console.log(`Connection has been established successfully: ${PGHOST}/${PGDATABASE}`);
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

fs
    .readdirSync(__dirname)
    .filter(file => {
        // filter ~.model.js files in api/pg/sequelize-models directory
        return (file.indexOf('.model.') !== 0) && (file !== basename) && (file.slice(-9) === '.model.js');
    })
    .forEach(file => {
        // import the models
        const model = sqInstance.import(path.join(__dirname, file));
        models[model.name] = model;
    });

Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

models.sequelize = sqInstance; // Sequelize instance
models.Sequelize = Sequelize; // Sequelize Library itself
module.exports = models;
