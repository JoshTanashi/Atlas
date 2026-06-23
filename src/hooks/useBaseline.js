import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getAll, put, remove, replaceAll } from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

export function useBaseline() {
  const { session, guestMode } = useAuth();
  const [income, setIncome] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session && !guestMode) return;

    const [cachedIncome, cachedAccounts, cachedDebts] = await Promise.all([
      getAll('income'),
      getAll('accounts'),
      getAll('debts'),
    ]);
    if (cachedIncome.length) setIncome(cachedIncome[0]);
    setAccounts(cachedAccounts);
    setDebts(cachedDebts);
    setLoading(false);

    if (!session) {
      // Guest mode: the device store is the only copy, nothing to sync.
      return;
    }

    const [incomeRes, accountsRes, debtsRes] = await Promise.all([
      supabase.from('baseline_income').select('*').maybeSingle(),
      supabase.from('baseline_accounts').select('*'),
      supabase.from('baseline_debts').select('*'),
    ]);

    if (!incomeRes.error) {
      const row = incomeRes.data ? { id: 'income', ...incomeRes.data } : null;
      setIncome(row);
      await replaceAll('income', row ? [row] : []);
    }
    if (!accountsRes.error && accountsRes.data) {
      setAccounts(accountsRes.data);
      await replaceAll('accounts', accountsRes.data);
    }
    if (!debtsRes.error && debtsRes.data) {
      setDebts(debtsRes.data);
      await replaceAll('debts', debtsRes.data);
    }
  }, [session, guestMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function setMonthlyIncome(monthlyIncomeCents, extra = {}) {
    if (!session) {
      await put('income', { id: 'income', monthly_income_cents: monthlyIncomeCents, ...extra, updated_at: new Date().toISOString() });
      await refresh();
      return;
    }
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase
      .from('baseline_income')
      .upsert({ user_id: session.user.id, monthly_income_cents: monthlyIncomeCents, ...extra, updated_at: new Date().toISOString() });
    if (error) throw error;
    await refresh();
  }

  async function upsertAccount(account) {
    const row = { ...account, id: account.id ?? crypto.randomUUID(), updated_at: new Date().toISOString() };
    if (!session) {
      await put('accounts', row);
      await refresh();
      return;
    }
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('baseline_accounts').upsert({ ...row, user_id: session.user.id });
    if (error) throw error;
    await refresh();
  }

  async function deleteAccount(id) {
    if (!session) {
      await remove('accounts', id);
      await refresh();
      return;
    }
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('baseline_accounts').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function upsertDebt(debt) {
    const row = { ...debt, id: debt.id ?? crypto.randomUUID(), updated_at: new Date().toISOString() };
    if (!session) {
      await put('debts', row);
      await refresh();
      return;
    }
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('baseline_debts').upsert({ ...row, user_id: session.user.id });
    if (error) throw error;
    await refresh();
  }

  async function deleteDebt(id) {
    if (!session) {
      await remove('debts', id);
      await refresh();
      return;
    }
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('baseline_debts').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { income, accounts, debts, loading, setMonthlyIncome, upsertAccount, deleteAccount, upsertDebt, deleteDebt, refresh };
}
