import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getAll, put, remove, replaceAll } from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

export function useGoals() {
  const { session, guestMode } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session && !guestMode) return;

    const cached = await getAll('goals');
    if (cached.length) setGoals(cached);
    setLoading(false);

    if (!session) {
      // Guest mode: the device store is the only copy, nothing to sync.
      return;
    }

    const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setGoals(data);
      await replaceAll('goals', data);
    }
    setLoading(false);
  }, [session, guestMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createGoal(input) {
    const row = {
      id: crypto.randomUUID(),
      name: input.name,
      target_cents: input.targetCents,
      saved_cents: input.savedCents ?? 0,
      target_date: input.targetDate ?? null,
      monthly_contribution_cents: input.monthlyContributionCents ?? null,
      created_at: new Date().toISOString(),
    };

    if (!session) {
      await put('goals', row);
      await refresh();
      return row;
    }

    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('goals').insert({ ...row, user_id: session.user.id });
    if (error) throw error;
    await refresh();
    return row;
  }

  async function updateGoal(id, updates) {
    if (!session) {
      const existing = (await getAll('goals')).find((g) => g.id === id);
      if (existing) await put('goals', { ...existing, ...updates });
      await refresh();
      return;
    }

    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('goals').update(updates).eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function deleteGoal(id) {
    if (!session) {
      await remove('goals', id);
      await refresh();
      return;
    }

    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { goals, loading, createGoal, updateGoal, deleteGoal, refresh };
}
