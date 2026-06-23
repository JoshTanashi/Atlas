import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { C } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { formatRands, randsToCents } from '../../../lib/money.js';
import { useBaseline } from '../../../hooks/useBaseline.js';
import { describeError } from '../shared.js';
import { StepHeading, StepFooter } from '../components/StepShell.jsx';

export function DebtsStep({ onNext }) {
  const { debts, upsertDebt } = useBaseline();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [payment, setPayment] = useState('');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!name || !balance || !apr) return;
    setError(null);
    setAdding(true);
    try {
      await upsertDebt({
        name,
        balance_cents: randsToCents(Number(balance)),
        apr: Number(apr),
        monthly_payment_cents: payment ? randsToCents(Number(payment)) : null,
      });
      setName('');
      setBalance('');
      setApr('');
      setPayment('');
    } catch (e) {
      setError(describeError(e));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <StepHeading title="Any debts?" subtitle="Add loans or credit so Atlas can show your payoff timeline and interest cost." />

      {debts.length > 0 && (
        <Card style={{ marginBottom: '1rem' }}>
          {debts.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(168, 83, 74, 0.1)', flexShrink: 0 }}>
                <CreditCard size={15} strokeWidth={2} color={C.over} />
              </span>
              <p style={{ color: C.ink, fontSize: '0.88rem' }}>{d.name} — {formatRands(d.balance_cents)} @ {d.apr}%</p>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginBottom: '1rem' }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Car loan" />
        <Input label="Balance owed" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="e.g. 85000" />
        <Input label="Interest rate (APR %)" type="number" value={apr} onChange={(e) => setApr(e.target.value)} placeholder="e.g. 11.5" />
        <Input label="Monthly payment (optional)" type="number" value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="e.g. 3200" />
        <Button variant="secondary" onClick={handleAdd} disabled={adding || !name || !balance || !apr} style={{ width: '100%' }}>
          + Add debt
        </Button>
        {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
      </Card>

      <StepFooter onContinue={onNext} continueLabel={debts.length ? 'Continue' : 'Skip for now'} />
    </div>
  );
}
