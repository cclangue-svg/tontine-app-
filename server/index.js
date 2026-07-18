const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const userRoutes = require('./routes/user.routes');
const tontineRoutes = require('./routes/tontine.routes');
const roundRoutes = require('./routes/round.routes');
const contributionRoutes = require('./routes/contribution.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Fichiers statiques du frontend (PWA)
app.use(express.static(path.join(__dirname, '..', 'client')));

// Routes API
app.use('/api/users', userRoutes);
app.use('/api/tontines', tontineRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api', roundRoutes); // expose /api/tontines/:id/rounds et /api/rounds/:roundId/disburse

app.use('/api', notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`Serveur Cercle démarré sur le port ${config.port}`);
});
