const contributionService = require('../services/contribution.service');

async function markPaid(req, res, next) {
  try {
    const { payment_method } = req.body;
    const contribution = await contributionService.markContributionPaid({
      contributionId: req.params.id,
      paymentMethod: payment_method,
      performedByUserId: req.user.id
    });
    res.json(contribution);
  } catch (err) {
    next(err);
  }
}

module.exports = { markPaid };
