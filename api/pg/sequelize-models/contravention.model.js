'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('contravention', {
        cn_number_offline: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        cn_number: DataTypes.BIGINT,
        creation: DataTypes.DATE,
        address_simplified: DataTypes.STRING,
        is_paid: DataTypes.BOOLEAN,
        amount: DataTypes.INTEGER,
        car_plate: DataTypes.STRING,
        car_plate_ar: DataTypes.STRING,
        car_type: DataTypes.STRING,
        car_type_ar: DataTypes.STRING,
        car_brand: DataTypes.STRING,
        car_brand_ar: DataTypes.STRING,
        car_brand_id: DataTypes.INTEGER,
        car_model: DataTypes.STRING,
        car_model_ar: DataTypes.STRING,
        car_model_id: DataTypes.INTEGER,

        car_color: DataTypes.STRING,
        car_color_ar: DataTypes.STRING,
        plate_country: DataTypes.STRING,
        plate_country_ar: DataTypes.STRING,
        plate_picture: DataTypes.STRING,
        plate_type: DataTypes.STRING,
        plate_type_ar: DataTypes.STRING,
        plate_type_code: DataTypes.STRING,
        creator_id: DataTypes.STRING,
        creator_username: DataTypes.STRING,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        reference: DataTypes.STRING,
        violation_id: DataTypes.INTEGER, // REFERENCES violation(id)
        violation: DataTypes.STRING,
        violation_ar: DataTypes.STRING,
        violation_picture: DataTypes.STRING,
        observation_time: DataTypes.INTEGER,


        project_id : DataTypes.INTEGER, // REFERENCES project(id)
        project_name: DataTypes.STRING,
        zone_id : DataTypes.INTEGER,
        zone_name: DataTypes.STRING,
        city_cd: DataTypes.STRING,
        intersection_cd: DataTypes.STRING,
        intersection_name_en: DataTypes.STRING,
        intersection_name_ar: DataTypes.STRING,
        street_cd: DataTypes.STRING,
        street_name_ar: DataTypes.STRING,
        street_name_en: DataTypes.STRING,
        status: DataTypes.STRING,
        status_review: DataTypes.STRING,
        status_challenge: DataTypes.STRING,
        sent_by: DataTypes.STRING,
        canceled_by: DataTypes.STRING,
        violation_code: DataTypes.STRING,
        notes: DataTypes.TEXT,


        sent_at: DataTypes.DATE,
        evolved_into_cn_at: DataTypes.DATE,
        canceled_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.project, {
            as: 'project',
            foreignKey: 'project_id',
            targetKey: 'id'
        });

        model.belongsTo(models.job, {
            as: 'job',
            foreignKey: 'car_plate',
            targetKey: 'car_plate'
        });
    };
    model.associate = function(models) {
        model.hasOne(models.cn_review, {
            foreignKey: 'cn_number',
            sourceKey: 'cn_number'
        });
    }

    return model;
};
