const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireOrganizerViaContribution } = require('../middleware/permissions');
const controller = require('../controllers/contribution.controller');

const router = express.Router();

// Marquer une cotisation payée — réservé à l'admin (un membre ne peut pas s'auto-valider)
router.post('/:id/mark-paid', requireAuth, requireOrganizerViaContribution, controller.markPaid);

module.exports = router;
