import { useState } from 'react';
import { Landmark } from 'lucide-react';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { formatRands, randsToCents } from '../../../lib/money.js';
import { useBaseline } from '../../../hooks/useBaseline.js';
import { describeError } from '../shared.js';
import { StepHeading, StepFooter } from '../components/StepShell.jsx';

const ACCOUNT_KINDS = ['checking', 'savings', 'investment', 'other'];

export function AccountsStep({ onNext }) {
  const { accounts, upsertAccount } = useBaseline();
  const [name, setName] = useState('');
  const [kind, setKind] = useState(ACCOUNT_KINDS[0]);
  const [balance, setBalance] = useState('');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!name || !balance) return;
    setError(null);
    setAdding(true);
    try {
      await upsertAccount({ name, kind, balance_cents: randsToCents(Number(balance)) });
      setName('');
      setBalance('');
    } catch (e) {
      setError(describeError(e));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <StepHeading title="Your accounts" subtitle="Add the accounts you'd like Atlas to track so it can show your net worth." />

      {accounts.length > 0 && (
        <Card style={{ marginBottom: '1rem' }}>
          {accounts.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream, flexShrink: 0 }}>
                <Landmark size={15} strokeWidth={2} color={C.sageDeep} />
              </span>
              <p style={{ color: C.ink, fontSize: '0.88rem' }}>{a.name} — {formatRands(a.balance_cents)}</p>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginBottom: '1rem' }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Everyday account" />
        <div style={{ marginBottom: '1rem' }}>
          <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: `1px solid ${C.line}`, background: C.paper, color: C.ink, fontFamily: F.sans, fontSize: '0.95rem' }}
          >
            {ACCOUNT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <Input label="Current balance" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="e.g. 14500" />
        <Button variant="secondary" onClick={handleAdd} disabled={adding || !name || !balance} style={{ width: '100%' }}>
          + Add account
        </Button>
        {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
      </Card>

      <StepFooter onContinue={onNext} continueLabel={accounts.length ? 'Continue' : 'Skip for now'} />
    </div>
  );
}
