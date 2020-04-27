const sequelize = require('../sequelize-models').sequelize;
const contraventionModel = require('../sequelize-models').contravention;
const cnChallengeModel = require('../sequelize-models').cn_challenge;
const cnReviewModel = require('../sequelize-models').cn_review;
const employeeModel = require('../sequelize-models').employee;
const mqttPublisher = require('../../services/MQTT/publisher');
const mqttTopic = require('../../contravention/constants').MqttSubject;
const { CNStatus, CNStatusChallenge, CNChallengeDecision } = require('../../contravention/constants');

module.exports = {
  getAll(req, res) {
    const values = req.query;
    const fields = Object.keys(values);
    let from = values['from'] || '';
    let to = values['to'] || '';

    let contraventionQuery = { status: [CNStatus.CN, CNStatus.CancelCN] };
    let cnReviewQuery = {};
    let cnChallengeQuery = {};

    fields.forEach(x => {
      if (x !== 'from' && x !== 'to' && values[x]) {
        switch (x) {
          case 'cn_number':
            contraventionQuery[x] = parseInt(values[x], 10);
            break;

          case 'cn_number_offline':
            contraventionQuery[x] = { $like: `%${values[x]}%` };
            break;

          case 'creator_username':
            contraventionQuery[x] = { $like: `%${values[x]}%` };
            break;

          case 'car_plate':
            contraventionQuery[x] = { $like: `%${values[x]}%` };
            break;

          case 'status_challenge':
            contraventionQuery[x] = { $in: values[x].split(',') };
            break;

          default:
            contraventionQuery[x]  = values[x];
        }
      }
    });

    if (from && to && !values['cn_number'] && !values['cn_number_offline']) {
      contraventionQuery['creation'] = {
        $between: [from, to],
      };
      // cnChallengeQuery['requested_at'] = {
      //   $between: [from, to],
      // };
    }

    cnChallengeModel
      .findAll({
        attributes: [
          ['id', 'challenge_id'],
          'decision_reason',
          'requested_at',
          'requested_by',
        ],
        where: cnChallengeQuery,
        include: [
          {
            model: contraventionModel,
            where: contraventionQuery,
          },
          {
            model: cnReviewModel,
            attributes: [
              ['id', 'review_id'],
              'challenge_reason',
              'data_modification',
              'reviewed_by',
              'reviewed_at',
              'error',
            ],
            where: cnReviewQuery,
          },
          {
            model: employeeModel,
            as: 'requester',
            attributes: [
                ['username', 'requester_username'],
                ['employee_id', 'requester_id'],
                [employeeModel.sequelize.literal("firstname || ' ' || lastname"), 'requester_fullname']
            ],
          },
        ]
      })
      .then((results) => {
        let resArr = [];
        results.forEach(({
          dataValues: {challenge_id, decision_reason, requested_by, requested_at, contravention, cn_review, requester}
        }) => {
          let data = { challenge_id, decision_reason, requested_by, requested_at };
          if (contravention) {
            data = { ...data, ...contravention.dataValues }
          }
          if (cn_review) {
            data = { ...data, ...cn_review.dataValues }
          }
          if (requester) {
            data = { ...data, ...requester.dataValues }
          }
          resArr.push(data);
        });
        res.status(200).send(resArr);
      })
      .catch((error) => res.status(400).send(error));
  },

  getCnChallengeById(req, res) {
    return cnChallengeModel
      .findByPk(req.params.id, {
        include: [{
          model: cnChallengeModel
        }],
      })
      .then((result) => {
        if (!result) {
          return res.status(404).send({
            message: 'Not Found',
          });
        }
        return res.status(200).send(result);
      })
      .catch((error) => res.status(400).send(error));
  },

  add(req, res) {
    const values = req.body;
    const fields = Object.keys(values);
    let body = {};
    fields.forEach(x => {
      if (x !== 'id' && values[x] !== null) {
        body[x]  = values[x]
      }
    });

    return cnChallengeModel
      .create(body)
      .then((result) => res.status(201).send(result))
      .catch((error) => res.status(400).send(error));
  },

  update(req, res) {
    const values = req.body;
    const fields = Object.keys(values);
    let body = {};

    fields.forEach(x => {
      if (x !== 'id' && values[x] !== null) {
        body[x]  = values[x]
      }
    });

    return cnChallengeModel
      .findByPk(req.params.id)
      .then(result => {
        if (!result) {
          return res.status(404).send({
            message: 'Not Found',
          });
        }
        return result
          .update(body)
          .then(() => res.status(200).send(result))
          .catch((error) => res.status(400).send(error));
      })
      .catch((error) => res.status(400).send(error));
  },

  delete(req, res) {
    return cnChallengeModel
      .findByPk(req.params.id)
      .then(result => {
        if (!result) {
          return res.status(400).send({
            message: 'Not Found',
          });
        }
        return result
          .destroy()
          .then(() => res.status(204).send())
          .catch((error) => res.status(400).send(error));
      })
      .catch((error) => res.status(400).send(error));
  },

  async validate(req, res) {
    try {
      const [challenge, review, contravention] = await Promise.all([
        cnChallengeModel.findByPk(req.params.id),
        cnReviewModel.findByPk(req.body.review_id),
        contraventionModel.findByPk(req.body.contravention),
      ]);

      if (!challenge || !review || !contravention) {
        return res.status(404).send({
          message: 'Not Found',
        });
      }

      const results = await sequelize.transaction(async (t) => {
        return await Promise.all([
          contravention.update({
            status_review: CNStatusChallenge.Cancelled,
            status_challenge: CNStatusChallenge.Cancelled,
            status: CancelCN.CancelCN,
            canceled_at: new Date(),
            canceled_by: req._user.employee_id,
          },{
            transaction: t,
          }),

          review.update({
            decision: CNChallengeDecision.Cancelled,
          },{
            transaction: t,
          }),

          challenge.update({
            decision: CNChallengeDecision.Cancelled,
            decision_reason: req.body.decision_reason,
            decided_by: req._user.employee_id,
            decided_at: new Date(),
          },{
            transaction: t,
          }),
        ]);
      });

      // MQTT - publisher
      mqttPublisher.client.publish(
        mqttTopic.UpdatedCN,
        JSON.stringify(results[1])
      );
      res.status(200).send(results);
    } catch(err) {
      res.status(400).send(err);
    }
  },

  async reject(req, res) {
    try {
      const [challenge, contravention] = await Promise.all([
        cnChallengeModel.findByPk(req.params.id),
        contraventionModel.findByPk(req.body.contravention),
      ]);

      if (!challenge || !contravention) {
        return res.status(404).send({
          message: 'Not Found',
        });
      }

      const results = await sequelize.transaction(async (t) => {
        return await Promise.all([
          contravention.update({
            status_challenge: CNStatusChallenge.Rejected,
            status: CNStatus.CN,
          },{
            transaction: t,
          }),

          challenge.update({
            decision: CNStatusChallenge.Rejected,
            decision_reason: req.body.decision_reason,
            decided_by: req._user.employee_id,
            decided_at: new Date(),
          },{
            transaction: t,
          }),
        ]);
      });

      // MQTT - publisher
      mqttPublisher.client.publish(
        mqttTopic.UpdatedCN,
        JSON.stringify(results[1])
      );

      res.status(200).send(results);
    } catch(err) {
      res.status(400).send(err);
    }
  }
};
