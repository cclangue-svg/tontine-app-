const supabase = require('../db/supabaseClient');
const AppError = require('../utils/AppError');
const { generateInviteCode } = require('../utils/inviteCode');

async function createTontine({ name, organizerId, contributionAmount, frequency, currency, paymentNumber, paymentProvider }) {
  const invite_code = generateInviteCode();

  const { data: tontine, error } = await supabase
    .from('tontines')
    .insert({
      name,
      organizer_id: organizerId,
      contribution_amount: contributionAmount,
      frequency,
      currency: currency || 'XAF',
      invite_code,
      payment_number: paymentNumber,
      payment_provider: paymentProvider
    })
    .select()
    .single();

  if (error) throw new AppError('Impossible de créer la tontine.', 500);

  const { error: memberError } = await supabase
    .from('tontine_members')
    .insert({ tontine_id: tontine.id, user_id: organizerId, payout_order: 1 });

  if (memberError) throw new AppError("Impossible d'ajouter l'organisateur comme membre.", 500);

  return tontine;
}

async function joinTontine({ inviteCode, userId }) {
  const { data: tontine, error: findError } = await supabase
    .from('tontines')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();

  if (findError) throw new AppError('Erreur lors de la recherche de la tontine.', 500);
  if (!tontine) throw new AppError("Code d'invitation invalide.", 404);

  const { data: alreadyMember } = await supabase
    .from('tontine_members')
    .select('id')
    .eq('tontine_id', tontine.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (alreadyMember) throw new AppError('Tu es déjà membre de cette tontine.', 409);

  const { count } = await supabase
    .from('tontine_members')
    .select('*', { count: 'exact', head: true })
    .eq('tontine_id', tontine.id);

  const { data: member, error: joinError } = await supabase
    .from('tontine_members')
    .insert({ tontine_id: tontine.id, user_id: userId, payout_order: (count || 0) + 1 })
    .select()
    .single();

  if (joinError) throw new AppError('Impossible de rejoindre la tontine.', 500);

  return { tontine, member };
}

/**
 * Calcule la cagnotte actuelle (fonds déposés non encore distribués) à partir du grand livre.
 * C'est la seule source de vérité pour "combien d'argent l'app détient" — jamais un champ modifiable directement.
 */
async function getPotBalance(tontineId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('tontine_id', tontineId);

  if (error) throw new AppError('Impossible de calculer la cagnotte.', 500);

  return (data || []).reduce((sum, t) => {
    return t.type === 'deposit' ? sum + Number(t.amount) : sum - Number(t.amount);
  }, 0);
}

async function getTontineDetail(tontineId, requestingUserId) {
  const { data: tontine, error } = await supabase.from('tontines').select('*').eq('id', tontineId).single();
  if (error || !tontine) throw new AppError('Tontine introuvable.', 404);

  const { data: membership } = await supabase
    .from('tontine_members')
    .select('id')
    .eq('tontine_id', tontineId)
    .eq('user_id', requestingUserId)
    .maybeSingle();

  if (!membership) throw new AppError("Tu n'es pas membre de cette tontine.", 403);

  const { data: members } = await supabase
    .from('tontine_members')
    .select('*, users(name, phone)')
    .eq('tontine_id', tontineId)
    .order('payout_order', { ascending: true });

  const { data: currentRound } = await supabase
    .from('rounds')
    .select('*, tontine_members(*, users(name, phone))')
    .eq('tontine_id', tontineId)
    .eq('status', 'open')
    .order('round_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  let contributions = [];
  if (currentRound) {
    const { data } = await supabase
      .from('contributions')
      .select('*, tontine_members(*, users(name, phone))')
      .eq('round_id', currentRound.id);
    contributions = data || [];
  }

  const potBalance = await getPotBalance(tontineId);
  const isAdmin = tontine.organizer_id === requestingUserId;

  return { tontine, members, currentRound, contributions, potBalance, isAdmin };
}

async function deleteTontine(tontineId) {
  // La suppression en cascade (définie dans schema.sql) nettoie automatiquement
  // membres, tours, cotisations et transactions liés à cette tontine.
  const { error } = await supabase.from('tontines').delete().eq('id', tontineId);
  if (error) throw new AppError('Impossible de supprimer la tontine.', 500);
}

module.exports = { createTontine, joinTontine, getTontineDetail, getPotBalance, deleteTontine };
