const model = require('./mat_table_definition.model');

exports.get = async (req, res, next) => {
    const {tableName} = req.params;
    const employeeId = req._user.employee_id;

    try {
        const tableDef = await model.getTableDef({tableName, employeeId});

        const data = [];
        for (const row of tableDef.rows) {
            if (row.data_type === 'select_fk') {
                const optionsResult = await model.getOptionsForSelect(row.options)

                const options = {};
                for (const optionsRow of optionsResult.rows) {
                    options[optionsRow.key] = optionsRow.title;
                }

                data.push({
                    ...row,
                    data_type: 'select',
                    options: {
                        options,
                    },
                });

                continue;
            }

            data.push(row);
        }

        return res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};
