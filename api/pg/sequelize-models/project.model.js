'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('project', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        project_name: DataTypes.STRING,
        project_code: DataTypes.STRING,
        vat_id: DataTypes.INTEGER,
        currency_code: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function (models) {
        // associations can be defined here
        model.belongsTo(models.vat, {
            foreignKey: 'vat_id'
        });
        model.hasMany(models.carpark, {
            foreignKey: 'project_id',
            sourceKey: 'id'
        });
    };
    return model;
};
