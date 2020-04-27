'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('log_metadata', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        log_level: { type: DataTypes.STRING},
        logger: { type: DataTypes.STRING },
        api: { type: DataTypes.STRING },
        function_name: { type: DataTypes.STRING },
        messages: { type: DataTypes.STRING },
        created_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true
    });
    return model;
};
