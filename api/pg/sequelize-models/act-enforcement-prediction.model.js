'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('act_enforcement_prediction', {
        job_position: DataTypes.STRING,
        issuance_rate: DataTypes.INTEGER,
        issuance_unity: DataTypes.STRING,
        groupage: DataTypes.STRING,
        forecast_unity: DataTypes.STRING,
        forecast_deployed: DataTypes.INTEGER,
        project_id : DataTypes.INTEGER, // REFERENCES project(id)
        project_name: DataTypes.STRING,
        forecast_per_unity: DataTypes.INTEGER,
        expected_unity: DataTypes.STRING,
        nbr_spaces_on_street_parking: DataTypes.INTEGER
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
