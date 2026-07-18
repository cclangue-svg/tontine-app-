const supabase = require('../db/supabaseClient');
const AppError = require('../utils/AppError');

/**
 * À utiliser APRÈS requireAuth. Vérifie que req.user est l'organisateur
 * de la tontine identifiée par req.params.id (ou req.params.tontineId).
 * C'est le vrai verrou : même si le front cache le bouton, l'API refuse ici.
 */
async function requireOrganizer(req, res, next) {
  const tontineId = req.params.id || req.params.tontineId;
  if (!tontineId) return next(new AppError('Tontine non spécifiée.', 400));

  const { data: tontine, error } = await supabase
    .from('tontines')
    .select('organizer_id')
    .eq('id', tontineId)
    .single();

  if (error || !tontine) return next(new AppError('Tontine introuvable.', 404));

  if (tontine.organizer_id !== req.user.id) {
    return next(new AppError("Action réservée à l'administrateur de la tontine.", 403));
  }

  next();
}

/**
 * Variante pour les routes identifiées par un round_id (ex: distribution des fonds).
 */
async function requireOrganizerViaRound(req, res, next) {
  const roundId = req.params.roundId || req.params.id;
  if (!roundId) return next(new AppError('Tour non spécifié.', 400));

  const { data: round, error: roundErr } = await supabase
    .from('rounds')
    .select('tontine_id')
    .eq('id', roundId)
    .single();

  if (roundErr || !round) return next(new AppError('Tour introuvable.', 404));

  const { data: tontine, error } = await supabase
    .from('tontines')
    .select('organizer_id')
    .eq('id', round.tontine_id)
    .single();

  if (error || !tontine) return next(new AppError('Tontine introuvable.', 404));
  if (tontine.organizer_id !== req.user.id) {
    return next(new AppError("Action réservée à l'administrateur de la tontine.", 403));
  }
  next();
}

/**
 * Variante pour les routes identifiées par une contribution_id (ex: marquer payé).
 */
async function requireOrganizerViaContribution(req, res, next) {
  const contributionId = req.params.id;

  const { data: contribution, error: contribErr } = await supabase
    .from('contributions')
    .select('round_id')
    .eq('id', contributionId)
    .single();

  if (contribErr || !contribution) return next(new AppError('Cotisation introuvable.', 404));

  const { data: round, error: roundErr } = await supabase
    .from('rounds')
    .select('tontine_id')
    .eq('id', contribution.round_id)
    .single();

  if (roundErr || !round) return next(new AppError('Tour introuvable.', 404));

  const { data: tontine, error } = await supabase
    .from('tontines')
    .select('organizer_id')
    .eq('id', round.tontine_id)
    .single();

  if (error || !tontine) return next(new AppError('Tontine introuvable.', 404));
  if (tontine.organizer_id !== req.user.id) {
    return next(new AppError("Action réservée à l'administrateur de la tontine.", 403));
  }
  next();
}

module.exports = { requireOrganizer, requireOrganizerViaRound, requireOrganizerViaContribution };
