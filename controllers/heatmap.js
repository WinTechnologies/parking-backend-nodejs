const heatmapModel = require('../models/heatmap');

const get = (req, res, next) => {
  heatmapModel.get(req.query).then(response => {
    return res.status(200).json(response);
  })
  .catch (err=> {
    next(err);
  });
}

const getPredictive = (req, res, next) => {
  heatmapModel.getPredictive(req.query).then(response => {
    return res.status(200).json(response);
  })
  .catch (err=> {
    next(err);
  });
}

const getUniqueDates = (req, res, next) => {
  heatmapModel.getUniqueDates(req.query).then(response => {
    return res.status(200).json(response);
  })
  .catch (err=> {
    next(err);
  });
}

const getPredictiveDates = (req, res, next) => {
  heatmapModel.getPredictiveDates(req.query).then(response => {
    return res.status(200).json(response);
  })
  .catch (err=> {
    next(err);
  });
}

exports.get = get;
exports.getPredictive = getPredictive;
exports.getUniqueDates = getUniqueDates;
exports.getPredictiveDates = getPredictiveDates;
