const supabase = require('../db/supabaseClient');
const AppError = require('../utils/AppError');

/**
 * Marque une cotisation comme payée ET enregistre le dépôt correspondant dans le grand livre.
 * Réservé à l'admin (filtré en amont par requireOrganizer) — un membre ne peut pas s'auto-valider.
 */
async function markContributionPaid({ contributionId, paymentMethod, performedByUserId }) {
  const { data: contribution, error: findErr } = await supabase
    .from('contributions')
    .select('*')
    .eq('id', contributionId)
    .single();

  if (findErr || !contribution) throw new AppError('Cotisation introuvable.', 404);
  if (contribution.paid) throw new AppError('Cette cotisation est déjà marquée payée.', 409);

  const { data: round } = await supabase.from('rounds').select('tontine_id').eq('id', contribution.round_id).single();

  const { data: updated, error: updateErr } = await supabase
    .from('contributions')
    .update({
      paid: true,
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
      marked_by: performedByUserId
    })
    .eq('id', contributionId)
    .select()
    .single();

  if (updateErr) throw new AppError('Impossible de confirmer le paiement.', 500);

  const { error: txError } = await supabase.from('transactions').insert({
    tontine_id: round.tontine_id,
    round_id: contribution.round_id,
    type: 'deposit',
    amount: contribution.amount,
    member_id: contribution.member_id,
    performed_by: performedByUserId,
    note: `Cotisation confirmée via ${paymentMethod || 'non précisé'}`
  });

  if (txError) throw new AppError("Impossible d'enregistrer le dépôt dans le grand livre.", 500);

  return updated;
}

module.exports = { markContributionPaid };
