'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('asset_model_2', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, // REFERENCES asset model_id
        code: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING },
        type_id: { type: DataTypes.STRING, allowNull: false }, // asset_type id
        icon_url: { type: DataTypes.STRING },
        img_url: { type: DataTypes.STRING },
        manufacturer: { type: DataTypes.STRING },
        firmware_version: { type: DataTypes.STRING },
        configurations: { type: DataTypes.STRING },
        notes: { type: DataTypes.STRING },
        fullspecs_link: { type: DataTypes.STRING },

        product_warranty: { type: DataTypes.DATE },
        created_by: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE },
        // deployed_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.asset_type_2, {
            as: 'type',
            foreignKey: 'type_id',
            targetKey: 'id'
        });
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
