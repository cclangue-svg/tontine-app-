const supabase = require('../db/supabaseClient');
const AppError = require('../utils/AppError');

async function findOrCreateUser({ phone, name }) {
  const { data: existing, error: findErr } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (findErr) throw new AppError('Erreur lors de la recherche du profil.', 500);
  if (existing) return existing;

  const { data: created, error: createErr } = await supabase
    .from('users')
    .insert({ phone, name })
    .select()
    .single();

  if (createErr) throw new AppError('Impossible de créer le profil.', 500);
  return created;
}

async function getUserTontines(userId) {
  const { data, error } = await supabase
    .from('tontine_members')
    .select('tontine_id, tontines(*)')
    .eq('user_id', userId);

  if (error) throw new AppError('Impossible de charger les tontines.', 500);
  return (data || []).map((m) => m.tontines);
}

module.exports = { findOrCreateUser, getUserTontines };
