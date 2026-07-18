const supabase = require('../db/supabaseClient');
const AppError = require('../utils/AppError');
const { getPotBalance } = require('./tontine.service');

async function startRound({ tontineId, dueDate }) {
  const { data: nextMembers } = await supabase
    .from('tontine_members')
    .select('*')
    .eq('tontine_id', tontineId)
    .eq('has_received', false)
    .order('payout_order', { ascending: true })
    .limit(1);

  if (!nextMembers || nextMembers.length === 0) {
    throw new AppError('Tous les membres ont déjà reçu leur tour. Tontine terminée.', 400);
  }

  const { data: existingOpen } = await supabase
    .from('rounds')
    .select('id')
    .eq('tontine_id', tontineId)
    .eq('status', 'open')
    .maybeSingle();

  if (existingOpen) throw new AppError('Un tour est déjà en cours.', 409);

  const beneficiary = nextMembers[0];

  const { count } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })
    .eq('tontine_id', tontineId);

  const { data: round, error } = await supabase
    .from('rounds')
    .insert({
      tontine_id: tontineId,
      round_number: (count || 0) + 1,
      beneficiary_member_id: beneficiary.id,
      due_date: dueDate
    })
    .select()
    .single();

  if (error) throw new AppError('Impossible de démarrer le tour.', 500);

  const { data: allMembers } = await supabase.from('tontine_members').select('*').eq('tontine_id', tontineId);
  const { data: tontine } = await supabase.from('tontines').select('*').eq('id', tontineId).single();

  const contributionRows = allMembers.map((m) => ({
    round_id: round.id,
    member_id: m.id,
    amount: tontine.contribution_amount
  }));

  const { error: contribError } = await supabase.from('contributions').insert(contributionRows);
  if (contribError) throw new AppError('Impossible de générer les cotisations du tour.', 500);

  return round;
}

/**
 * Distribution des fonds au bénéficiaire du tour — ACTION ADMIN UNIQUEMENT.
 * Enregistre une transaction de type 'disbursement' dans le grand livre (jamais une simple mise à jour de solde),
 * puis clôture le tour. L'accès à cette fonction est déjà filtré en amont par le middleware requireOrganizer.
 */
async function disburseRound({ roundId, performedByUserId }) {
  const { data: round, error } = await supabase.from('rounds').select('*').eq('id', roundId).single();
  if (error || !round) throw new AppError('Tour introuvable.', 404);
  if (round.status === 'closed') throw new AppError('Ce tour est déjà clôturé.', 409);

  const potBalance = await getPotBalance(round.tontine_id);
  if (potBalance <= 0) throw new AppError('La cagnotte est vide, rien à distribuer.', 400);

  const { error: txError } = await supabase.from('transactions').insert({
    tontine_id: round.tontine_id,
    round_id: round.id,
    type: 'disbursement',
    amount: potBalance,
    member_id: round.beneficiary_member_id,
    performed_by: performedByUserId,
    note: `Distribution du tour #${round.round_number}`
  });
  if (txError) throw new AppError("Impossible d'enregistrer la distribution.", 500);

  const { error: closeError } = await supabase
    .from('rounds')
    .update({ status: 'closed' })
    .eq('id', roundId);
  if (closeError) throw new AppError('Impossible de clôturer le tour.', 500);

  const { error: memberError } = await supabase
    .from('tontine_members')
    .update({ has_received: true })
    .eq('id', round.beneficiary_member_id);
  if (memberError) throw new AppError('Impossible de mettre à jour le bénéficiaire.', 500);

  return { disbursedAmount: potBalance };
}

module.exports = { startRound, disburseRound };
