import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getAll, replaceAll, put } from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) return;

    const cached = await getAll('events');
    if (cached.length) {
      setEvents(sortByOccurredAtDesc(cached));
      setLoading(false);
    }

    const { data, error } = await supabase
      .from('financial_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      await replaceAll('events', data);
      setEvents(sortByOccurredAtDesc(data));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function logEvent(input) {
    if (!navigator.onLine) {
      throw new Error('OFFLINE');
    }

    const row = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      amount_cents: input.amountCents,
      direction: input.direction,
      merchant: input.merchant,
      category: input.category,
      note: input.note ?? null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Optimistic local update first so the Timeline feels instant.
    setEvents((prev) => sortByOccurredAtDesc([row, ...prev]));
    await put('events', row);

    const { error } = await supabase.from('financial_events').insert(row);

    if (error) {
      // Roll back the optimistic insert on a real failure (not an offline case, already guarded above).
      setEvents((prev) => prev.filter((e) => e.id !== row.id));
      throw error;
    }

    return row;
  }

  return (
    <EventsContext.Provider value={{ events, loading, logEvent, refresh }}>
      {children}
    </EventsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook are intentionally co-located
export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within an EventsProvider');
  return ctx;
}

function sortByOccurredAtDesc(rows) {
  return [...rows].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
}
