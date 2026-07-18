const tontineService = require('../services/tontine.service');

async function create(req, res, next) {
  try {
    const { name, contribution_amount, frequency, currency, payment_number, payment_provider } = req.body;
    const tontine = await tontineService.createTontine({
      name,
      organizerId: req.user.id,
      contributionAmount: contribution_amount,
      frequency,
      currency,
      paymentNumber: payment_number,
      paymentProvider: payment_provider
    });
    res.status(201).json(tontine);
  } catch (err) {
    next(err);
  }
}

async function join(req, res, next) {
  try {
    const { invite_code } = req.body;
    const result = await tontineService.joinTontine({ inviteCode: invite_code, userId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const data = await tontineService.getTontineDetail(req.params.id, req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    await tontineService.deleteTontine(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, join, detail, destroy };
