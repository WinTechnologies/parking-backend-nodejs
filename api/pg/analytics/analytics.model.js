const client = require('../../../helpers/postgresClient');
const CHART_TABLE = 'chart';

const getOne = (id) => {
    let query = `select * from ${CHART_TABLE} WHERE id = $1`;
    return client.query(query, [id]);
};

const getChartDetail = (chart, queryParams) => {
    let query = {
        fields: '',
        from: `${chart.table_name}`,
        where: `timestamp '${queryParams.from}' <= ${chart.date_param} AND ${chart.date_param} <= timestamp '${queryParams.to}'`,
        groupBy: 'GROUP BY ',
        orderBy: ''
    };

    if (queryParams.project_id) {
        query.where += ` AND project_id = ${queryParams.project_id}`;
    }
    const chartParams = JSON.parse(chart.parameters);
    const extraParams = JSON.parse(chart.extra_params);
    switch (chart.chart_type) {
        case 'bar':
            query.fields = `${chartParams.x} x, ${extraParams.aggregation}(${chartParams.y}) y`;
            query.fields += chartParams.z
                ? `, ${chartParams.z} z`
                : '';
            query.groupBy += chartParams.z
                ? `${chartParams.x}, ${chartParams.z}`
                : `${chartParams.x}`;
            break;
        case 'line':
            query.fields = `to_char(date_trunc('${chart.group_by_date_param}', ${chart.date_param}), 'YYYY-MM-DD') x,
                            ${extraParams.aggregation}(${chartParams.y}) y`;
            query.fields += chartParams.z
                ? `, ${chartParams.z} z`
                : '';
            query.groupBy += chartParams.z
                ? `x, ${chartParams.z}`
                : `x`;
            query.orderBy = 'ORDER BY x asc';
            break;
        case 'pie':
            query.fields = `${chartParams.x} x, ${extraParams.aggregation}(${chartParams.y}) y`;
            query.groupBy += chartParams.x;
            break;
        case 'map':
            query.fields = `${chartParams.x}, ${chartParams.z}`;
            query.groupBy = '';
            break;
        default:
            break;
    }

    const fullQuery = `SELECT ${query.fields} FROM ${query.from} WHERE ${query.where} ${query.groupBy} ${query.orderBy}`;
    console.log(fullQuery);
    return client.query(fullQuery);
};

/**
 *
 * @param chart: {db_table, params} from chart table
 *  params: JSON string
 *  {
 *   "axes": {
 *     "x": "creation",
 *     "y": "amount",
 *     "z": "status"
 *   },
 *   "extra": {
 *     "aggregation":"SUM",
 *     "computation":"percentage"
 *   },
 *   "date": "creation",
 *   "group_date": "week"
 * }';
 * @param queryParams
 * @returns {*}
 */
const runAnalyticsQuery = (chart, queryParams, projectId) => {
    const sqlParams = JSON.parse(chart.params);
    const { axes, extra, date, group_date } = sqlParams;

    let query = {
        fields: '',
        from: `${chart.db_table}`,
        where: `timestamp '${queryParams.from}' <= ${date} AND ${date} <= timestamp '${queryParams.to}'`,
        groupBy: 'GROUP BY ',
        orderBy: ''
    };

    // if (queryParams.project_id) {
    //     query.where += ` AND project_id = ${queryParams.project_id}`;
    // }
    if (projectId) {
        if (chart.db_table === 'asset_2' || chart.db_table === 'contravention' || chart.db_table === 'job' || chart.db_table === 'project_employee') {
            query.where += ` AND project_id = ${projectId}`;
        }
    }

    switch (chart.type) {
        case 'bar':
            /* Bar Chart
                SELECT
                  $axes.x x,
                  $extra.aggregation($axes.y) y,
                  $axes.z z
                FROM $db_table AND project_id = $queryParams.project_id
                WHERE timestamp $queryParams.from <= $date AND $date <= timestamp $queryParams.to
                GROUP BY x, z;
             */
            query.fields = axes.z
                ? `${axes.x} x, ${extra.aggregation}(${axes.y}) y, ${axes.z} z`
                : `${axes.x} x, ${extra.aggregation}(${axes.y}) y`;
            query.groupBy += axes.z ? `x, z` : `x`;
            break;
        case 'line':
            /* Line Chart
                SELECT
                  to_char(date_trunc($group_date, $axes.x), 'YYYY-MM-DD') x,
                  $extra.aggregation($axes.y) y,
                  $axes.z z
                FROM $db_table AND project_id = $queryParams.project_id
                WHERE timestamp $queryParams.from <= $date AND $date <= timestamp $queryParams.to
                GROUP BY x, z
                ORDER BY x asc;
             */
            query.fields = axes.z
                ? `to_char(date_trunc('${group_date}', ${date}), 'YYYY-MM-DD') x, ${extra.aggregation}(${axes.y}) y, ${axes.z} z`
                : `to_char(date_trunc('${group_date}', ${date}), 'YYYY-MM-DD') x, ${extra.aggregation}(${axes.y}) y`;
            query.groupBy += axes.z ? `x, z` : `x`;
            query.orderBy = 'ORDER BY x asc';
            break;
        case 'pie':
            /* Pie Chart
                SELECT
                  $axes.x x,
                  $extra.aggregation($axes.y) y
                FROM $db_table AND project_id = $queryParams.project_id
                WHERE timestamp $queryParams.from <= $date AND $date <= timestamp $queryParams.to
                GROUP BY x;
             */
            query.fields = `${axes.x} x, ${extra.aggregation}(${axes.y}) y`;
            query.groupBy += 'x';
            break;
        case 'map':
            /* Map Chart
                SELECT
                  $axes.x x,
                  $axes.z z
                FROM $db_table AND project_id = $queryParams.project_id
                WHERE timestamp $queryParams.from <= $date AND $date <= timestamp $queryParams.to;
             */
            query.fields = `${axes.x}, ${axes.z}`;
            query.groupBy = '';
            break;
        default:
            break;
    }

    const fullQuery = `SELECT ${query.fields} FROM ${query.from} WHERE ${query.where} ${query.groupBy} ${query.orderBy}`;
    console.log(fullQuery);
    return client.query(fullQuery);
};

exports.getOne = getOne;

exports.getChartDetail = getChartDetail;
exports.runAnalyticsQuery = runAnalyticsQuery;
