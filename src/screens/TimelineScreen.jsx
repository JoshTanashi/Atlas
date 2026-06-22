import { C, F } from '../tokens.js';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { CategoryIcon } from '../components/ui/CategoryIcon.jsx';
import { formatRands } from '../lib/money.js';
import { useEvents } from '../hooks/useEvents.jsx';

function groupLabel(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  if (d >= weekAgo) return 'This Week';
  return 'Earlier';
}

export function TimelineScreen() {
  const { events, loading } = useEvents();

  if (loading) return <p style={{ color: C.slate }}>Loading…</p>;

  if (events.length === 0) {
    return (
      <EmptyState
        title="Your timeline is empty"
        body="Every entry you log appears here, grouped by day. Tap the + button to log your first one."
      />
    );
  }

  const groups = new Map();
  for (const event of events) {
    const label = groupLabel(new Date(event.occurred_at));
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(event);
  }

  return (
    <div>
      <ScreenHeader title="Timeline" showSearch />
      {[...groups.entries()].map(([label, items]) => (
        <div key={label} style={{ marginBottom: '1.5rem' }}>
          <span className="label">{label}</span>
          <div style={{ marginTop: '0.5rem' }}>
            {items.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0',
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <CategoryIcon category={e.category} direction={e.direction} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: C.ink }}>{e.merchant}</p>
                  <p style={{ color: C.slate, fontSize: '0.8rem', textTransform: 'capitalize' }}>
                    {e.category.replace('_', ' ')}
                  </p>
                </div>
                <span style={{ fontFamily: F.serif, color: e.direction === 'income' ? C.sageDeep : C.ink }}>
                  {e.direction === 'income' ? '+' : '-'}{formatRands(e.amount_cents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
