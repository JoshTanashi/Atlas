import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getAll, put, remove, replaceAll } from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

export function useRecurringExpenses() {
  const { session, guestMode } = useAuth();
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session && !guestMode) return;

    const cached = await getAll('recurringExpenses');
    if (cached.length) setRecurringExpenses(cached);
    setLoading(false);

    if (!session) {
      // Guest mode: the device store is the only copy, nothing to sync.
      return;
    }

    const { data, error } = await supabase.from('recurring_expenses').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setRecurringExpenses(data);
      await replaceAll('recurringExpenses', data);
    }
  }, [session, guestMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function upsertRecurringExpense(expense) {
    const row = { ...expense, id: expense.id ?? crypto.randomUUID() };

    if (!session) {
      await put('recurringExpenses', row);
      await refresh();
      return;
    }

    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('recurring_expenses').upsert({ ...row, user_id: session.user.id });
    if (error) throw error;
    await refresh();
  }

  async function deleteRecurringExpense(id) {
    if (!session) {
      await remove('recurringExpenses', id);
      await refresh();
      return;
    }

    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { recurringExpenses, loading, upsertRecurringExpense, deleteRecurringExpense, refresh };
}
