import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getAll, replaceAll } from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

export function useGoals() {
  const { session } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) return;

    const cached = await getAll('goals');
    if (cached.length) setGoals(cached);
    setLoading(false);

    const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setGoals(data);
      await replaceAll('goals', data);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createGoal(input) {
    if (!navigator.onLine) throw new Error('OFFLINE');
    const row = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      name: input.name,
      target_cents: input.targetCents,
      saved_cents: input.savedCents ?? 0,
      target_date: input.targetDate ?? null,
      monthly_contribution_cents: input.monthlyContributionCents ?? null,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('goals').insert(row);
    if (error) throw error;
    await refresh();
    return row;
  }

  async function updateGoal(id, updates) {
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('goals').update(updates).eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function deleteGoal(id) {
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { goals, loading, createGoal, updateGoal, deleteGoal, refresh };
}
