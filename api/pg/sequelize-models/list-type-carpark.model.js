'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_type_carpark', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        code: DataTypes.STRING,
        name: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
    };
    return model;
};
