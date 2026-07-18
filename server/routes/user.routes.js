const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/user.controller');

const router = express.Router();

router.post(
  '/register',
  [
    body('phone').trim().notEmpty().withMessage('Le numéro de téléphone est requis.'),
    body('name').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères.')
  ],
  validate,
  controller.register
);

router.get('/me/tontines', requireAuth, controller.myTontines);

module.exports = router;
