import { supabase } from './supabaseClient.js';
import { getAll, clearAllCaches } from './db.js';
import { loadGuestProfile, clearGuestProfile } from './guestStore.js';

// Copies everything a guest stored locally up to their new Supabase account.
// Must run to completion (or throw) before guestMode is cleared — see
// useAuth.exitGuestMode, which is only called after this resolves.
export async function migrateGuestData(session) {
  const userId = session.user.id;

  const [income, budget, accounts, debts, goals, recurringExpenses, corrections, events] = await Promise.all([
    getAll('income'),
    getAll('budget'),
    getAll('accounts'),
    getAll('debts'),
    getAll('goals'),
    getAll('recurringExpenses'),
    getAll('corrections'),
    getAll('events'),
  ]);

  if (income.length) {
    const { id, ...incomeFields } = income[0]; // baseline_income has no `id` column — strip the synthetic idb key
    void id;
    const { error } = await supabase.from('baseline_income').upsert({ ...incomeFields, user_id: userId });
    if (error) throw error;
  }

  if (budget.length) {
    const { id, ...budgetFields } = budget[0]; // baseline_budget has no `id` column — strip the synthetic idb key
    void id;
    const { error } = await supabase.from('baseline_budget').upsert({ ...budgetFields, user_id: userId });
    if (error) throw error;
  }

  if (accounts.length) {
    const { error } = await supabase
      .from('baseline_accounts')
      .upsert(accounts.map((row) => ({ ...row, user_id: userId })));
    if (error) throw error;
  }

  if (debts.length) {
    const { error } = await supabase
      .from('baseline_debts')
      .upsert(debts.map((row) => ({ ...row, user_id: userId })));
    if (error) throw error;
  }

  if (goals.length) {
    const { error } = await supabase
      .from('goals')
      .upsert(goals.map((row) => ({ ...row, user_id: userId })));
    if (error) throw error;
  }

  if (recurringExpenses.length) {
    const { error } = await supabase
      .from('recurring_expenses')
      .upsert(recurringExpenses.map((row) => ({ ...row, user_id: userId })));
    if (error) throw error;
  }

  if (corrections.length) {
    const { error } = await supabase.from('merchant_corrections').upsert(
      corrections.map(({ id, ...rest }) => {
        void id; // merchant_corrections is keyed by (user_id, merchant_key), not this synthetic idb id
        return { ...rest, user_id: userId };
      }),
    );
    if (error) throw error;
  }

  if (events.length) {
    const { error } = await supabase
      .from('financial_events')
      .upsert(events.map((row) => ({ ...row, user_id: userId })));
    if (error) throw error;
  }

  const guestProfile = loadGuestProfile();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: guestProfile.display_name,
      onboarding_completed_at: guestProfile.onboarding_completed_at,
      essential_categories: guestProfile.essential_categories,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  await clearAllCaches();
  clearGuestProfile();
}
