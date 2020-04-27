'use strict';

const bcrypt = require('bcrypt-nodejs');
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('employee', {
        employee_id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        id: DataTypes.INTEGER,
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        phone_number: DataTypes.STRING,
        job_position: DataTypes.STRING,
        address: DataTypes.STRING,
        date_start: DataTypes.DATE,
        date_end: DataTypes.DATE,
        department: DataTypes.STRING,
        img_url: DataTypes.STRING,
        landline: DataTypes.STRING,
        email: DataTypes.STRING,
        sex: DataTypes.INTEGER,
        day_of_birth: DataTypes.DATE,
        marital_status: DataTypes.STRING,
        username: DataTypes.STRING,
        password: DataTypes.STRING,
        mobile_imei: DataTypes.STRING,
        login_id: DataTypes.UUID,
        fullname_en: DataTypes.STRING,
        created_at: DataTypes.DATE,
        created_by:  DataTypes.STRING,
        status_id: DataTypes.INTEGER
    }, {
        timestamps: false,
        freezeTableName: true,
    });

    model.associate = function(models) {
        model.belongsTo(models.employee, {
            foreignKey: 'created_by',
            targetKey: 'employee_id',
            as: 'creator'
        });

        // model.belongsToMany(models.permission_template, {
        //     through: 'employee_permission',
        //     as: 'permission_templates',
        //     foreignKey: 'employee_id'
        // });
        //
        // model.hasMany(models.contravention, {
        //     foreignKey: 'canceled_by',
        //     sourceKey: 'employee_id'
        // });
        //
        // model.hasMany(models.cn_review, {
        //     foreignKey: 'reviewed_by',
        //     sourceKey: 'employee_id'
        // });
        //
        // model.hasMany(models.cn_challenge, {
        //     foreignKey: 'requested_by',
        //     sourceKey: 'employee_id'
        // });
        //
        // model.hasMany(models.cn_challenge, {
        //     foreignKey: 'decided_by',
        //     sourceKey: 'employee_id'
        // });
    };
    return model;
};
