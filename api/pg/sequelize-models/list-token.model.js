'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_token', {
        token_name: { type: DataTypes.STRING, primaryKey: true,allowNull: false },
        lifetime: DataTypes.INTEGER,
        unit: DataTypes.STRING,
        updated_at: DataTypes.DATE,
        updated_by: DataTypes.STRING,
        created_at: DataTypes.DATE,
        created_by: DataTypes.STRING
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });

        model.belongsTo(models.employee, {
            as: 'updater',
            foreignKey: 'updated_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
