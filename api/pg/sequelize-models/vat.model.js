'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('vat', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        vat_code: { type: DataTypes.STRING, allowNull: false },
        vat_percentage: { type: DataTypes.INTEGER, allowNull: false },
        vat_country: { type: DataTypes.STRING, allowNull: false },
        vat_name: { type: DataTypes.STRING, allowNull: false }
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    return model;
};
