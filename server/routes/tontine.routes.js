const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/tontine.controller');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Le nom de la tontine est requis.'),
    body('contribution_amount').isFloat({ gt: 0 }).withMessage('Le montant doit être supérieur à 0.'),
    body('frequency').isIn(['weekly', 'monthly']).withMessage('Fréquence invalide.'),
    body('payment_number').optional({ checkFalsy: true }).trim().isLength({ min: 6 }).withMessage('Numéro de téléphone invalide.'),
    body('payment_provider').optional({ checkFalsy: true }).isIn(['airtel_money', 'orange_money', 'autre']).withMessage('Opérateur invalide.')
  ],
  validate,
  controller.create
);

router.post(
  '/join',
  requireAuth,
  [body('invite_code').trim().isLength({ min: 6, max: 6 }).withMessage("Code d'invitation invalide.")],
  validate,
  controller.join
);

router.get('/:id', requireAuth, controller.detail);

module.exports = router;
