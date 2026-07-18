const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireOrganizer, requireOrganizerViaRound } = require('../middleware/permissions');
const controller = require('../controllers/round.controller');

const router = express.Router();

// Démarrer un tour — réservé à l'admin de la tontine :id
router.post(
  '/tontines/:id/rounds',
  requireAuth,
  requireOrganizer,
  [body('due_date').isISO8601().withMessage('Date d\'échéance invalide.')],
  validate,
  controller.start
);

// Distribuer les fonds du tour — réservé à l'admin, vérifié via le round lui-même
router.post('/rounds/:roundId/disburse', requireAuth, requireOrganizerViaRound, controller.disburse);

module.exports = router;
