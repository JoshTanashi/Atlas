import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Input } from '../components/ui/Input.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { CategoryIcon } from '../components/ui/CategoryIcon.jsx';
import { formatRands } from '../lib/money.js';
import { useEvents } from '../hooks/useEvents.jsx';

export function SearchScreen() {
  const { events } = useEvents();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return events.filter((e) =>
      e.merchant.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.note ?? '').toLowerCase().includes(q)
    );
  }, [events, query]);

  return (
    <div>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', marginBottom: '1.25rem' }}>Search</h1>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="coffee, fuel, December…"
        autoFocus
      />

      {query.trim() && results.length === 0 && (
        <EmptyState icon={SearchX} title="No matches" body={`Nothing found for "${query}".`} />
      )}

      {results.map((e) => (
        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderBottom: `1px solid ${C.line}` }}>
          <CategoryIcon category={e.category} direction={e.direction} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: C.ink }}>{e.merchant}</p>
            <p style={{ color: C.slate, fontSize: '0.8rem' }}>{new Date(e.occurred_at).toLocaleDateString()}</p>
          </div>
          <span style={{ fontFamily: F.serif, color: e.direction === 'income' ? C.sageDeep : C.ink }}>
            {e.direction === 'income' ? '+' : '-'}{formatRands(e.amount_cents)}
          </span>
        </div>
      ))}
    </div>
  );
}
