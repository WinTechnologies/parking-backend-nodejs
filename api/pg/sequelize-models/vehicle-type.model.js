'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('vehicle_type', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        type_en: DataTypes.STRING,
        type_ar: DataTypes.STRING,
        img_url: DataTypes.STRING,
        created_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
    };
    return model;
};
