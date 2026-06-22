import { useState } from 'react';
import { Target } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { formatRands, randsToCents } from '../lib/money.js';
import { navigate } from '../lib/nav.js';
import { useGoals } from '../hooks/useGoals.js';

export function GoalsScreen() {
  const { goals, loading, createGoal } = useGoals();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [targetRands, setTargetRands] = useState('');
  const [error, setError] = useState(null);

  async function handleCreate() {
    if (!name.trim() || !targetRands) return;
    try {
      await createGoal({ name: name.trim(), targetCents: randsToCents(Number(targetRands)) });
      setName('');
      setTargetRands('');
      setCreating(false);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to create a goal." : 'Could not create goal.');
    }
  }

  if (loading) return <p style={{ color: C.slate }}>Loading…</p>;

  return (
    <div>
      <ScreenHeader
        title="Goals"
        action={<Button variant="ghost" onClick={() => setCreating((v) => !v)}>{creating ? 'Cancel' : '+ New goal'}</Button>}
      />

      {creating && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <Input label="Goal name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency fund" />
          <Input label="Target amount (R)" type="number" value={targetRands} onChange={(e) => setTargetRands(e.target.value)} placeholder="10000" />
          {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <Button onClick={handleCreate} style={{ width: '100%' }}>Create goal</Button>
        </Card>
      )}

      {goals.length === 0 && !creating && (
        <EmptyState title="No goals yet" body="Create one to track progress toward something you're saving for." />
      )}

      {goals.map((g) => {
        const progress = Math.min(1, g.saved_cents / g.target_cents);
        return (
          <Card key={g.id} style={{ marginBottom: '0.75rem' }}>
            <div onClick={() => navigate(`/goals/${g.id}`)} style={{ cursor: 'pointer', display: 'flex', gap: '0.75rem' }}>
              <span
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: C.cream, flexShrink: 0,
                }}
              >
                <Target size={17} strokeWidth={2} color={C.sageDeep} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: F.serif, fontSize: '1.1rem', color: C.ink }}>{g.name}</p>
                <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  {formatRands(g.saved_cents)} of {formatRands(g.target_cents)}
                </p>
                <div style={{ height: '6px', background: C.line, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: C.sage }} />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
