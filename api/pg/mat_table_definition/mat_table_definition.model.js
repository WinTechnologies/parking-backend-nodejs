const client = require('../../../helpers/postgresClient');

const TABLE_MAT_TABLE_DEFINITIONS = 'mat_table_definition';
const TABLE_MAT_TABLE_USER_DEFINITIONS = 'mat_table_user_definition';

exports.getTableDef = ({tableName, employeeId}) => {
    const query = `
        SELECT def.column_name,
               COALESCE(user_def.column_label, def.column_label) AS column_label,
               COALESCE(user_def.is_show, def.is_show) AS is_show,
               def.is_nullable,
               COALESCE(user_def.can_update, def.is_updatable) as can_update,
               COALESCE(user_def.ordinal_position, def.ordinal_position) as ordinal_position,
               def.data_type,
               def.options
        FROM ${TABLE_MAT_TABLE_DEFINITIONS} def
            LEFT JOIN ${TABLE_MAT_TABLE_USER_DEFINITIONS} user_def
                ON user_def.employee_id = $2
                AND def.table_name = user_def.table_name
                AND def.column_name = user_def.column_name
        WHERE def.table_name = $1
        ORDER BY COALESCE(user_def.ordinal_position, def.ordinal_position),
                 COALESCE(user_def.column_label, def.column_label)
    `;

    return client.query(query, [tableName, employeeId]);
};

exports.getOptionsForSelect = ({table, key, title}) => {
    const query = `
        SELECT ${key} AS key, ${title} AS title
        FROM ${table}
    `;

    return client.query(query, []);
};
