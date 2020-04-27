const client = require('../../../helpers/postgresClient');
const TABLE_VEHICLE_COLOR = 'vehicle_color';
const TABLE_VEHICLE_MAKE = 'vehicle_make';
const TABLE_VEHICLE_MODEL = 'vehicle_model';
const TABLE_VEHICLE_TYPE = 'vehicle_type';
const TABLE_VEHICLE_PLATE_TYPE = 'vehicle_plate_type';

module.exports = {
    getColors(params) {
        let query = `SELECT * FROM ${TABLE_VEHICLE_COLOR}`;

        Object.keys(params).forEach((field, index, fields) => {
            query += `${index === 0 ? ' WHERE' : ' AND '} ${ field } = '${ params[field] }'`;
        });
        return client.query(query);
    },

    getMakes(params) {
        let query = `SELECT * FROM ${TABLE_VEHICLE_MAKE}`;

        Object.keys(params).forEach((field, index, fields) => {
            query += `${index === 0 ? ' WHERE' : ' AND '} ${ field } = '${ params[field] }'`;
        });
        query += ' ORDER BY clicks DESC';
        return client.query(query);
    },

    async increaseBrandClick(brandName) {
        const brandNameColumn = 'make_name_en';
        let query = `SELECT clicks FROM ${TABLE_VEHICLE_MAKE} WHERE ${brandNameColumn} = '${brandName}'`;
        const result = await client.query(query);

        if (result.rows && result.rows.length === 1) {
            const oldClicks = result.rows[0].clicks || 0;
            query = `UPDATE ${TABLE_VEHICLE_MAKE} SET clicks = ${oldClicks + 1} WHERE ${brandNameColumn} = '${brandName}'`;
            return client.query(query);
        }
    },

    getModels(params) {
        let query = `SELECT * FROM ${TABLE_VEHICLE_MODEL}`;

        Object.keys(params).forEach((field, index, fields) => {
            query += `${index === 0 ? ' WHERE' : ' AND '} ${ field } = '${ params[field] }'`;
        });
        return client.query(query);
    },

    async increaseModelClick(modelName) {
        const modelNameColumn = 'model_name_en';
        let query = `SELECT clicks FROM ${TABLE_VEHICLE_MODEL} WHERE ${modelNameColumn} = '${modelName}'`;
        const result = await client.query(query);

        if (result.rows && result.rows.length === 1) {
            const oldClicks = result.rows[0].clicks || 0;
            query = `UPDATE ${TABLE_VEHICLE_MODEL} SET clicks = ${oldClicks + 1} WHERE ${modelNameColumn} = '${modelName}'`;
            return client.query(query);
        }
    },

    getTypes(params) {
        let query = `SELECT * FROM ${TABLE_VEHICLE_TYPE}`;

        Object.keys(params).forEach((field, index, fields) => {
            query += `${index === 0 ? ' WHERE' : ' AND '} ${ field } = '${ params[field] }'`;
        });
        return client.query(query);
    },

    getPlateTypes(params) {
        let query = `SELECT * FROM ${TABLE_VEHICLE_PLATE_TYPE}`;

        Object.keys(params).forEach((field, index, fields) => {
            query += `${index === 0 ? ' WHERE is_active=TRUE ' : ' AND '} ${ field } = '${ params[field] }'`;
        });
        return client.query(query);
    },
};

