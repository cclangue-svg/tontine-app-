const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');

function signToken(user) {
  return jwt.sign({ sub: user.id, phone: user.phone, name: user.name }, config.jwtSecret, {
    expiresIn: config.jwtExpiry
  });
}

/**
 * Vérifie le token et attache req.user. Bloque la requête si absent/invalide.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(new AppError('Authentification requise.', 401));

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, phone: payload.phone, name: payload.name };
    next();
  } catch (err) {
    next(new AppError('Session invalide ou expirée. Reconnecte-toi.', 401));
  }
}

module.exports = { signToken, requireAuth };
