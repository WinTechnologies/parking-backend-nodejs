'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('alert_incident', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        incident_id: {type: DataTypes.INTEGER}, // ref list_incedent(id)
        codification_id: { type: DataTypes.STRING }, // ref asset_2(codification_id)
        latitude: { type: DataTypes.FLOAT },
        longitude: { type: DataTypes.FLOAT },
        // img_url: { type: DataTypes.ARRAY(DataTypes.STRING) },
        img_url: { type: DataTypes.STRING },
        note: { type: DataTypes.STRING },

        created_by: { type: DataTypes.STRING }, // employee id
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        // model.belongsTo(models.asset_2, {
        //     as: 'asset_2',
        //     foreignKey: 'codification_id',
        //     targetKey: 'codification_id'
        // });
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
