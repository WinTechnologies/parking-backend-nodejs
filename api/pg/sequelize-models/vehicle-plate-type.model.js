'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('vehicle_plate_type', {
        type_code: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        type_name_en: DataTypes.INTEGER,
        type_name_ar: DataTypes.STRING,
        type_color: DataTypes.STRING,
        display_order: DataTypes.INTEGER,
        issue_authority: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        // associations can be defined here
    };
    return model;
};
