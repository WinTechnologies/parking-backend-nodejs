const onStreetWidgetModel = require('./on_street_widget.model');

const get = (req, res, next) => {
    onStreetWidgetModel.get(req.query)
        .then(response => res.status(200).json(response))
        .catch(err => res.status(400).json({ message: err.message }));
};

exports.get = get;