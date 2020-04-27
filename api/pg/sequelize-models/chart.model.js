'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('chart', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
        db_table: { type: DataTypes.TEXT, allowNull: false },
        db_sql: { type: DataTypes.TEXT, allowNull: false },
        params: { type: DataTypes.TEXT, allowNull: false },
        dashboard_id : DataTypes.INTEGER, // REFERENCES dashboard(id),
        created_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        created_at: DataTypes.DATE,
        // modified_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        modified_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.dashboard, {
            as: 'dashboard',
            foreignKey: 'dashboard_id',
            targetKey: 'id'
        });

        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });

        // model.belongsTo(models.employee, {
        //     as: 'modifier',
        //     foreignKey: 'modified_by',
        //     targetKey: 'employee_id'
        // });
    };
    return model;
};
