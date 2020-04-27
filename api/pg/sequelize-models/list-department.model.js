'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_department', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        department_name: {type: DataTypes.STRING}, 
        department_code: { type: DataTypes.STRING }
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {};

    return model;
};