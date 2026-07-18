const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  if (!isOperational) {
    logger.error('Erreur non gérée', { message: err.message, stack: err.stack, path: req.path });
  } else {
    logger.warn(err.message, { path: req.path });
  }

  res.status(statusCode).json({
    error: isOperational ? err.message : 'Une erreur interne est survenue.'
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route introuvable.' });
}

module.exports = { errorHandler, notFoundHandler };
