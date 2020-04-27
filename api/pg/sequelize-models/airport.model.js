'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('airport', {
        iata: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        icao: DataTypes.STRING,
        name: DataTypes.STRING,
        location: DataTypes.STRING,
        timezone: DataTypes.STRING,
        dst: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    return model;
};
