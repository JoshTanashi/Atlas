import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getAll, replaceAll } from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

// Returns a plain { merchant_key: category } map, cache-first, plus a saver that
// upserts the correction both to Supabase and the local cache.
export function useMerchantCorrections() {
  const { session } = useAuth();
  const [corrections, setCorrections] = useState({});

  const refresh = useCallback(async () => {
    if (!session) return;

    const cached = await getAll('corrections');
    if (cached.length) setCorrections(toMap(cached));

    const { data, error } = await supabase.from('merchant_corrections').select('*');
    if (!error && data) {
      const rows = data.map((row) => ({ id: row.merchant_key, ...row }));
      setCorrections(toMap(rows));
      await replaceAll('corrections', rows);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveCorrection(merchantKey, category) {
    setCorrections((prev) => ({ ...prev, [merchantKey]: category }));
    if (!navigator.onLine) return; // best-effort; will sync next time the user corrects or app refreshes online
    const { error } = await supabase
      .from('merchant_corrections')
      .upsert({ user_id: session.user.id, merchant_key: merchantKey, category, updated_at: new Date().toISOString() });
    if (!error) await refresh();
  }

  return { corrections, saveCorrection };
}

function toMap(rows) {
  return Object.fromEntries(rows.map((row) => [row.merchant_key, row.category]));
}
