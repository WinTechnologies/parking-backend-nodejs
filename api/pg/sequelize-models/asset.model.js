'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('asset_2', {
        codification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, // REFERENCES sale(codification_id)
        latitude: { type: DataTypes.FLOAT },
        longitude: { type: DataTypes.FLOAT },
        status: { type: DataTypes.STRING },
        configurations: { type: DataTypes.STRING },
        notes: { type: DataTypes.STRING },
        ip_address: { type: DataTypes.STRING },
        vehicle_plate: { type: DataTypes.STRING },
        vehicle_plate_ar: { type: DataTypes.STRING },
        vehicle_brand: { type: DataTypes.STRING },
        vehicle_brand_ar: { type: DataTypes.STRING },
        vehicle_country: { type: DataTypes.STRING },
        vehicle_country_ar: { type: DataTypes.STRING },
        img_url: { type: DataTypes.STRING },
        status_vehicle: { type: DataTypes.STRING },

        project_id : { type: DataTypes.INTEGER }, // REFERENCES project(id)
        zone_id: { type: DataTypes.INTEGER }, // project zone id
        model_id: { type: DataTypes.INTEGER }, // ref asset-model id
        parking_id: { type: DataTypes.INTEGER }, // parking id
        carpark_id: { type: DataTypes.INTEGER }, // carpark id
        carpark_zone_id: { type: DataTypes.INTEGER }, // carpark zone id

        warranty_until: { type: DataTypes.DATE },
        eol_at: { type: DataTypes.DATE },
        created_by: { type: DataTypes.STRING }, // employee id
        created_at: { type: DataTypes.DATE },
        deployed_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        // associations can be defined here
        // model.belongsTo(models.carpark_zone, {
        //     as: 'carpark_zone',
        //     foreignKey: 'carpark_zone_id',
        //     targetKey: 'id'
        // });
        // model.belongsTo(models.carpark, {
        //     as: 'carpark',
        //     foreignKey: 'carpark_id',
        //     targetKey: 'id'
        // });
        // model.belongsTo(models.parking, {
        //     as: 'parking',
        //     foreignKey: 'parking_id',
        //     targetKey: 'id'
        // });
        model.belongsTo(models.asset_model_2, {
            as: 'model',
            foreignKey: 'model_id',
            targetKey: 'id'
        });
        // model.belongsTo(models.project_zone, {
        //     as: 'zone',
        //     foreignKey: 'zone_id',
        //     targetKey: 'id'
        // });
        model.belongsTo(models.project, {
            as: 'project',
            foreignKey: 'project_id',
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
