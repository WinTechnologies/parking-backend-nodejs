'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('job', {
        job_number: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
        job_type: DataTypes.STRING,
        creation: DataTypes.DATE,
        cn_number: DataTypes.BIGINT, // REFERENCES contravention(cn_number)
        cn_number_offline: DataTypes.STRING, // REFERENCES contravention(cn_number_offline)
        address_simplified: DataTypes.STRING,
        car_plate: DataTypes.STRING,
        car_plate_ar: DataTypes.STRING,
        car_brand: DataTypes.STRING,
        car_model: DataTypes.STRING,
        car_color_ar: DataTypes.STRING,
        car_color: DataTypes.STRING,
        plate_country: DataTypes.STRING,
        plate_type: DataTypes.STRING,
        plate_type_ar: DataTypes.STRING,
        cancel_reason: DataTypes.STRING,
        car_pound_id: DataTypes.STRING,
        clamp_barcode: DataTypes.BIGINT,
        clamp_pictures: DataTypes.STRING,
        creator_id: DataTypes.STRING, // REFERENCES employee(employee_id)
        creator_username: DataTypes.STRING,
        taker_id: DataTypes.STRING, // REFERENCES employee(employee_id)
        taker_username: DataTypes.STRING,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        latitude_towing_delivered: DataTypes.FLOAT,
        longitude_towing_delivered: DataTypes.FLOAT,
        latitude_towing_pickup: DataTypes.FLOAT,
        longitude_towing_pickup: DataTypes.FLOAT,
        geolocation_towing: DataTypes.STRING,
        reference: { type: DataTypes.STRING, allowNull: true, unique: true },
        project_id : DataTypes.INTEGER, // REFERENCES project(id)
        project_name: DataTypes.STRING,
        vehicle_codification: DataTypes.STRING,
        violation_id: DataTypes.INTEGER, // REFERENCES violation(id)
        violation: DataTypes.STRING,
        violation_pictures: DataTypes.STRING,
        amount: DataTypes.INTEGER,
        is_paid: DataTypes.BOOLEAN,
        zone_id: DataTypes.INTEGER, // REFERENCES zone(id)
        zone_name: DataTypes.STRING,
        city_cd: DataTypes.STRING,
        intersection_cd: DataTypes.STRING,
        intersection_name_en: DataTypes.STRING,
        intersection_name_ar: DataTypes.STRING,
        street_cd: DataTypes.STRING,
        street_name_ar: DataTypes.STRING,
        street_name_en: DataTypes.STRING,
        status: DataTypes.STRING,
        sent_by: DataTypes.STRING, // REFERENCES employee(employee_id)
        sent_at: DataTypes.DATE,
        violation_code: DataTypes.STRING,
        history: DataTypes.JSON,
        canceled_code: DataTypes.STRING, // REFERENCES list_job_cancellation_reason(code)
        canceled_by: DataTypes.STRING, // REFERENCES employee(employee_id)
        canceled_at: DataTypes.DATE,
        tow_pictures: DataTypes.STRING,
        declamp_pictures: DataTypes.STRING,
        defect_pictures: DataTypes.STRING,
        defect_infos: DataTypes.JSON,

        date_start: DataTypes.DATE,
        date_end: DataTypes.DATE,
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
    };
    return model;
};
