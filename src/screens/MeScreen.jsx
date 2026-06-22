import { useState } from 'react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { formatRands, randsToCents, centsToRands } from '../lib/money.js';
import { debtAmortization } from '../lib/formulas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useBaseline } from '../hooks/useBaseline.js';
import { useEvents } from '../hooks/useEvents.js';
import { supabase } from '../lib/supabaseClient.js';

export function MeScreen() {
  const { session, signOut } = useAuth();
  const { income, accounts, debts, setMonthlyIncome, upsertAccount, deleteAccount, upsertDebt, deleteDebt } = useBaseline();
  const { events } = useEvents();

  const [incomeInput, setIncomeInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function handleExport() {
    const payload = { exportedAt: new Date().toISOString(), events, income, accounts, debts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    if (!window.confirm('This permanently deletes your account and all data. This cannot be undone. Continue?')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await signOut();
    } catch {
      setDeleteError('Could not delete your account. Please try again, or contact support.');
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', marginBottom: '1.25rem' }}>Me</h1>

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Account</span>
        <p style={{ color: C.ink, marginTop: '0.4rem' }}>{session?.user?.email}</p>
      </Card>

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Monthly income</span>
        <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {income ? `Currently ${formatRands(income.monthly_income_cents)}/month` : 'Not set — unlocks your savings rate.'}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Input
            type="number"
            value={incomeInput}
            onChange={(e) => setIncomeInput(e.target.value)}
            placeholder={income ? centsToRands(income.monthly_income_cents).toString() : 'R per month'}
          />
          <Button
            style={{ height: 'fit-content' }}
            onClick={() => incomeInput && setMonthlyIncome(randsToCents(Number(incomeInput))).then(() => setIncomeInput(''))}
          >
            Save
          </Button>
        </div>
      </Card>

      <BaselineListCard
        title="Accounts & balances"
        emptyHint="Unlocks net worth and emergency-fund runway."
        items={accounts}
        renderItem={(a) => `${a.name} (${a.kind}) — ${formatRands(a.balance_cents)}`}
        onAdd={(name, kind, balanceRands) => upsertAccount({ name, kind, balance_cents: randsToCents(Number(balanceRands)) })}
        onDelete={deleteAccount}
        kindOptions={['checking', 'savings', 'investment', 'other']}
      />

      <DebtsCard debts={debts} upsertDebt={upsertDebt} deleteDebt={deleteDebt} />

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Your data</span>
        <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Export everything as JSON, or permanently delete your account and all data.
        </p>
        <Button variant="secondary" onClick={handleExport} style={{ width: '100%', marginBottom: '0.5rem' }}>
          Download my data
        </Button>
        <Button variant="ghost" onClick={signOut} style={{ width: '100%', marginBottom: '0.5rem' }}>
          Sign out
        </Button>
        {deleteError && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{deleteError}</p>}
        <Button
          variant="ghost"
          onClick={handleDeleteAccount}
          disabled={deleting}
          style={{ width: '100%', color: C.over }}
        >
          {deleting ? 'Deleting…' : 'Delete my account and all data'}
        </Button>
      </Card>
    </div>
  );
}

function BaselineListCard({ title, emptyHint, items, renderItem, onAdd, onDelete, kindOptions }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState(kindOptions[0]);
  const [balance, setBalance] = useState('');

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <span className="label">{title}</span>
      {items.length === 0 && <p style={{ color: C.slate, fontSize: '0.85rem', margin: '0.4rem 0' }}>{emptyHint}</p>}
      {items.map((item) => (
        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: `1px solid ${C.line}` }}>
          <span style={{ color: C.ink, fontSize: '0.9rem' }}>{renderItem(item)}</span>
          <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', color: C.slate }}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ flex: 2, minWidth: '90px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }}>
          {kindOptions.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" placeholder="R" style={{ flex: 1, minWidth: '70px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
        <Button
          onClick={() => { if (name && balance) { onAdd(name, kind, balance); setName(''); setBalance(''); } }}
        >
          Add
        </Button>
      </div>
    </Card>
  );
}

function DebtsCard({ debts, upsertDebt, deleteDebt }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [payment, setPayment] = useState('');

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <span className="label">Debts</span>
      {debts.length === 0 && (
        <p style={{ color: C.slate, fontSize: '0.85rem', margin: '0.4rem 0' }}>
          Unlocks debt payoff projections and interest-cost awareness.
        </p>
      )}
      {debts.map((d) => {
        const result = d.monthly_payment_cents ? debtAmortization(d) : null;
        return (
          <div key={d.id} style={{ padding: '0.5rem 0', borderTop: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.ink, fontSize: '0.9rem' }}>{d.name} — {formatRands(d.balance_cents)} @ {d.apr}%</span>
              <button onClick={() => deleteDebt(d.id)} style={{ background: 'none', border: 'none', color: C.slate }}>✕</button>
            </div>
            {result && (
              <p style={{ color: C.slate, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {result.amortizing
                  ? `${result.months} months to pay off, ~${formatRands(result.totalInterestCents)} in interest at this payment.`
                  : 'At this payment, this debt will never be paid off — your payment doesn\'t cover the interest.'}
              </p>
            )}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ flex: 2, minWidth: '80px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
        <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" placeholder="Balance (R)" style={{ flex: 1, minWidth: '90px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
        <input value={apr} onChange={(e) => setApr(e.target.value)} type="number" placeholder="APR %" style={{ flex: 1, minWidth: '70px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
        <input value={payment} onChange={(e) => setPayment(e.target.value)} type="number" placeholder="Payment/mo (R)" style={{ flex: 1, minWidth: '100px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
        <Button
          onClick={() => {
            if (!name || !balance || !apr) return;
            upsertDebt({
              name,
              balance_cents: randsToCents(Number(balance)),
              apr: Number(apr),
              monthly_payment_cents: payment ? randsToCents(Number(payment)) : null,
            });
            setName(''); setBalance(''); setApr(''); setPayment('');
          }}
        >
          Add
        </Button>
      </div>
    </Card>
  );
}
