import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getAll, replaceAll } from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

export function useRecurringExpenses() {
  const { session } = useAuth();
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) return;

    const cached = await getAll('recurringExpenses');
    if (cached.length) setRecurringExpenses(cached);
    setLoading(false);

    const { data, error } = await supabase.from('recurring_expenses').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setRecurringExpenses(data);
      await replaceAll('recurringExpenses', data);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function upsertRecurringExpense(expense) {
    if (!navigator.onLine) throw new Error('OFFLINE');
    const row = { ...expense, id: expense.id ?? crypto.randomUUID(), user_id: session.user.id };
    const { error } = await supabase.from('recurring_expenses').upsert(row);
    if (error) throw error;
    await refresh();
  }

  async function deleteRecurringExpense(id) {
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { recurringExpenses, loading, upsertRecurringExpense, deleteRecurringExpense, refresh };
}
