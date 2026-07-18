const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * À placer après un tableau de règles express-validator dans une route.
 * Rejette proprement la requête si une règle échoue.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return next(new AppError(firstError.msg, 422));
  }
  next();
}

module.exports = validate;
