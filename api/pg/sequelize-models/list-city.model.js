'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_city', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        city_code: {type: DataTypes.STRING}, 
        city_name: { type: DataTypes.STRING },
        city_code_pin: { type: DataTypes.STRING }
    }, {
        timestamps: false,
        freezeTableName: true
    });
    
    return model;
};