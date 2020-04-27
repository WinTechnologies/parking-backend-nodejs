const requireFields = {
  onstreet: [
    "type_client",
    "parking_id",
    "start_date",
    "start_time",
    "end_date",
    "end_time"
  ],
  carpark: [
    "type_client",
    "carpark_zone_id",
    "start_date",
    "start_time",
    "end_date",
    "end_time"
  ]
};

exports.StreetType = {
  OnStreet: 'onstreet',
  Carpark: 'carpark'
};

exports.checkRequiredFields = (body) => {
  if (body.street_type === undefined || body.street_type === null) {
    return ['street_type'];
  }
  return requireFields[body.street_type].filter((field) => !body.hasOwnProperty(field) || body[field] === undefined || body[field] === null)
};
