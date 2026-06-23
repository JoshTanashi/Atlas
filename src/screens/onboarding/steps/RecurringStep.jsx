import { useState } from 'react';
import { Repeat } from 'lucide-react';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { formatRands, randsToCents } from '../../../lib/money.js';
import { useRecurringExpenses } from '../../../hooks/useRecurringExpenses.js';
import { describeError } from '../shared.js';
import { StepHeading, StepFooter } from '../components/StepShell.jsx';

const EXPENSE_CATEGORIES = ['subscriptions', 'transport', 'health', 'shopping', 'airtime_data', 'uncategorized'];

export function RecurringStep({ onNext }) {
  const { recurringExpenses, upsertRecurringExpense } = useRecurringExpenses();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!name || !amount) return;
    setError(null);
    setAdding(true);
    try {
      await upsertRecurringExpense({
        name,
        amount_cents: randsToCents(Number(amount)),
        category,
        day_of_month: dayOfMonth ? Number(dayOfMonth) : null,
      });
      setName('');
      setAmount('');
      setDayOfMonth('');
    } catch (e) {
      setError(describeError(e));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <StepHeading
        title="Recurring expenses"
        subtitle="Add the debit orders and subscriptions that come off every month — rent, insurance, streaming, gym."
      />

      {recurringExpenses.length > 0 && (
        <Card style={{ marginBottom: '1rem' }}>
          {recurringExpenses.map((exp) => (
            <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream, flexShrink: 0 }}>
                <Repeat size={15} strokeWidth={2} color={C.sageDeep} />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.ink, fontSize: '0.88rem' }}>{exp.name} — {formatRands(exp.amount_cents)}</p>
                {exp.day_of_month && <p style={{ color: C.slate, fontSize: '0.75rem' }}>Debited on day {exp.day_of_month}</p>}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginBottom: '1rem' }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix" />
        <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 199" />
        <div style={{ marginBottom: '1rem' }}>
          <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: `1px solid ${C.line}`, background: C.paper, color: C.ink, fontFamily: F.sans, fontSize: '0.95rem' }}
          >
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
        <Input label="Day of the month it's debited (optional)" type="number" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="e.g. 1" />
        <Button variant="secondary" onClick={handleAdd} disabled={adding || !name || !amount} style={{ width: '100%' }}>
          + Add expense
        </Button>
        {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
      </Card>

      <StepFooter onContinue={onNext} continueLabel={recurringExpenses.length ? 'Continue' : 'Skip for now'} />
    </div>
  );
}
