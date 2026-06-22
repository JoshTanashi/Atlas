import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { formatRands, randsToCents } from '../lib/money.js';
import { goalProjection } from '../lib/formulas.js';
import { navigate } from '../lib/nav.js';
import { useGoals } from '../hooks/useGoals.js';

export function GoalDetailScreen({ goalId }) {
  const { goals, loading, updateGoal, deleteGoal } = useGoals();
  const [contributionRands, setContributionRands] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [savedRands, setSavedRands] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [actionError, setActionError] = useState(null);

  if (loading) return <p style={{ color: C.slate }}>Loading…</p>;

  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return <EmptyState title="Goal not found" body="It may have been deleted." />;

  const projection = goalProjection({
    target_cents: goal.target_cents,
    saved_cents: goal.saved_cents,
    target_date: goal.target_date ? new Date(goal.target_date) : null,
    monthly_contribution_cents: goal.monthly_contribution_cents,
  });

  function describeActionError(e) {
    return e.message === 'OFFLINE' ? "You're offline — connect to update this goal." : 'Could not update goal. Please try again.';
  }

  async function handleSetContribution() {
    if (!contributionRands) return;
    setActionError(null);
    try {
      await updateGoal(goal.id, { monthly_contribution_cents: randsToCents(Number(contributionRands)), target_date: null });
      setContributionRands('');
    } catch (e) {
      setActionError(describeActionError(e));
    }
  }

  async function handleSetTargetDate() {
    if (!targetDate) return;
    setActionError(null);
    try {
      await updateGoal(goal.id, { target_date: targetDate, monthly_contribution_cents: null });
      setTargetDate('');
    } catch (e) {
      setActionError(describeActionError(e));
    }
  }

  async function handleAddSaved() {
    if (!savedRands) return;
    setActionError(null);
    try {
      await updateGoal(goal.id, { saved_cents: goal.saved_cents + randsToCents(Number(savedRands)) });
      setSavedRands('');
    } catch (e) {
      setActionError(describeActionError(e));
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    try {
      await deleteGoal(goal.id);
      navigate('/goals');
    } catch (e) {
      setDeleteError(e.message === 'OFFLINE' ? "You're offline — connect to delete this goal." : 'Could not delete goal. Please try again.');
    }
  }

  return (
    <div>
      <button onClick={() => navigate('/goals')} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', color: C.slate, marginBottom: '1rem', padding: 0 }}>
        <ChevronLeft size={18} strokeWidth={2} /> Goals
      </button>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', marginBottom: '1rem' }}>{goal.name}</h1>

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Progress</span>
        <p style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink }}>
          {formatRands(goal.saved_cents)} <span style={{ fontSize: '1rem', color: C.slate }}>of {formatRands(goal.target_cents)}</span>
        </p>

        {projection.mode === 'target_date' && (
          <p style={{ color: C.slate, fontSize: '0.9rem', marginTop: '0.5rem' }}>
            You need {formatRands(projection.requiredMonthlyCents)}/month for {projection.monthsRemaining} months to hit your target date.
          </p>
        )}
        {projection.mode === 'contribution' && (
          <p style={{ color: C.slate, fontSize: '0.9rem', marginTop: '0.5rem' }}>
            At this pace, ~{projection.monthsToGoal} months to go (around {projection.projectedDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}).
          </p>
        )}
        {projection.mode === 'none' && (
          <p style={{ color: C.slate, fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Add a target date or a monthly contribution below to see your projection.
          </p>
        )}
      </Card>

      {actionError && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '1rem' }}>{actionError}</p>}

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Log a contribution</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Input value={savedRands} onChange={(e) => setSavedRands(e.target.value)} type="number" placeholder="Amount (R)" />
          <Button onClick={handleAddSaved} style={{ height: 'fit-content' }}>Add</Button>
        </div>
      </Card>

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Monthly contribution plan</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Input value={contributionRands} onChange={(e) => setContributionRands(e.target.value)} type="number" placeholder="R per month" />
          <Button onClick={handleSetContribution} style={{ height: 'fit-content' }}>Set</Button>
        </div>
      </Card>

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Or set a target date</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Input value={targetDate} onChange={(e) => setTargetDate(e.target.value)} type="date" />
          <Button onClick={handleSetTargetDate} style={{ height: 'fit-content' }}>Set</Button>
        </div>
      </Card>

      {deleteError && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{deleteError}</p>}
      <Button variant="ghost" onClick={handleDelete}>Delete goal</Button>
    </div>
  );
}
