'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('parking', {
        number: DataTypes.INTEGER,
        parking_code: DataTypes.STRING,
        name: DataTypes.STRING,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        parking_angle: DataTypes.INTEGER,
        parking_length: DataTypes.INTEGER,
        parking_spaces: DataTypes.INTEGER,
        parking_dimension: DataTypes.STRING,
        is_sensors: DataTypes.BOOLEAN,
        parking_type: DataTypes.STRING,
        managed_by: DataTypes.STRING,
        project_id : DataTypes.INTEGER, // REFERENCES project(id)
        zone_id : DataTypes.INTEGER, // REFERENCES zone(id)
        spaces_nbr_from : DataTypes.INTEGER,
        spaces_nbr_to : DataTypes.INTEGER,
        pictures_url : DataTypes.STRING,
        info_notes : DataTypes.STRING,
        connecting_points : DataTypes.STRING,
        name_ar : DataTypes.STRING,
        functioning : DataTypes.STRING,
        restriction : DataTypes.STRING,
        payment_methods : DataTypes.ARRAY(DataTypes.INTEGER),
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
