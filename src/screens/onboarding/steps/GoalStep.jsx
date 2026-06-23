import { useState } from 'react';
import { Card } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { randsToCents } from '../../../lib/money.js';
import { useGoals } from '../../../hooks/useGoals.js';
import { describeError } from '../shared.js';
import { StepHeading, StepFooter } from '../components/StepShell.jsx';

export function GoalStep({ onNext }) {
  const { goals, createGoal } = useGoals();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  async function handleContinue() {
    if (!name || !target) {
      onNext();
      return;
    }
    setError(null);
    setCreating(true);
    try {
      await createGoal({
        name,
        targetCents: randsToCents(Number(target)),
        savedCents: saved ? randsToCents(Number(saved)) : 0,
      });
      onNext();
    } catch (e) {
      setError(describeError(e));
      setCreating(false);
    }
  }

  return (
    <div>
      <StepHeading title="Set your first goal" subtitle="Optional — you can always add or change goals later." />

      <Card style={{ marginBottom: '1rem' }}>
        <Input label="What are you saving for?" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" />
        <Input label="Target amount" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 50000" />
        <Input label="Already saved (optional)" type="number" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="e.g. 5000" />
      </Card>

      <StepFooter
        onSkip={name && target ? onNext : undefined}
        onContinue={handleContinue}
        continueLabel={name && target ? 'Save goal and continue' : goals.length ? 'Continue' : 'Skip for now'}
        continueDisabled={creating}
        error={error}
      />
    </div>
  );
}
