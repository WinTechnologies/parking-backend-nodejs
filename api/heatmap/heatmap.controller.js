const heatmapModel = require('./heatmap.model');

const get = (req, res, next) => {
    heatmapModel.getAllByProjectsIds(req.query).then(data => {
        const response = {};
        data.rows.forEach((row) => {
            if (!response[row.code_id]) {
                response[row.code_id] = {
                    code_id: row.code_id,
                    weekday: row.weekday,
                    date: row.date,
                    lat: row.lat,
                    lng: row.lng,
                    hours: []
                }
            }
            response[row.code_id].hours.push({ date: row.date, hour: row.hour, intensity: parseFloat(row.intensity).toFixed(2) });
        });

        return res.status(200).json(Object.values(response));
    })
        .catch(err => {
            next(err);
        });
};

exports.get = get;
