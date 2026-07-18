const roundService = require('../services/round.service');

async function start(req, res, next) {
  try {
    const { due_date } = req.body;
    const round = await roundService.startRound({ tontineId: req.params.id, dueDate: due_date });
    res.status(201).json(round);
  } catch (err) {
    next(err);
  }
}

async function disburse(req, res, next) {
  try {
    const result = await roundService.disburseRound({
      roundId: req.params.roundId,
      performedByUserId: req.user.id
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { start, disburse };
