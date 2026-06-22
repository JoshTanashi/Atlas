import { useState } from 'react';
import { Landmark, PiggyBank, TrendingUp, Wallet, CreditCard, Download, Crown, Banknote } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { formatRands, randsToCents, centsToRands } from '../lib/money.js';
import { debtAmortization } from '../lib/formulas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useBaseline } from '../hooks/useBaseline.js';
import { useEvents } from '../hooks/useEvents.jsx';
import { useProfile } from '../hooks/useProfile.jsx';

const ACCOUNT_ICONS = { checking: Landmark, savings: PiggyBank, investment: TrendingUp, other: Wallet };

function SectionLabel({ children }) {
  return <p className="label" style={{ marginBottom: '0.6rem' }}>{children}</p>;
}

function IconBadge({ icon: Icon, color = C.sageDeep, background = C.cream }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background, flexShrink: 0 }}>
      <Icon size={16} strokeWidth={2} color={color} />
    </span>
  );
}

export function MeScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { income, accounts, debts, setMonthlyIncome, upsertAccount, deleteAccount, upsertDebt, deleteDebt } = useBaseline();
  const { events } = useEvents();

  const [incomeInput, setIncomeInput] = useState('');
  const [incomeError, setIncomeError] = useState(null);
  const [accountsError, setAccountsError] = useState(null);
  const [debtsError, setDebtsError] = useState(null);

  function describeBaselineError(e) {
    return e.message === 'OFFLINE' ? "You're offline — connect to save changes." : 'Could not save. Please try again.';
  }

  async function handleSaveIncome() {
    if (!incomeInput) return;
    setIncomeError(null);
    try {
      await setMonthlyIncome(randsToCents(Number(incomeInput)));
      setIncomeInput('');
    } catch (e) {
      setIncomeError(describeBaselineError(e));
    }
  }

  async function handleUpsertAccount(name, kind, balanceRands) {
    setAccountsError(null);
    try {
      await upsertAccount({ name, kind, balance_cents: randsToCents(Number(balanceRands)) });
    } catch (e) {
      setAccountsError(describeBaselineError(e));
    }
  }

  async function handleRemoveAccount(id) {
    setAccountsError(null);
    try {
      await deleteAccount(id);
    } catch (e) {
      setAccountsError(describeBaselineError(e));
    }
  }

  async function handleUpsertDebt(debt) {
    setDebtsError(null);
    try {
      await upsertDebt(debt);
    } catch (e) {
      setDebtsError(describeBaselineError(e));
    }
  }

  async function handleRemoveDebt(id) {
    setDebtsError(null);
    try {
      await deleteDebt(id);
    } catch (e) {
      setDebtsError(describeBaselineError(e));
    }
  }

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

  return (
    <div>
      <ScreenHeader title="Me" showSettings />

      <Card style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <span
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '3rem', height: '3rem', borderRadius: '50%',
            background: C.sage, color: C.paper, fontFamily: F.serif, fontSize: '1.3rem', flexShrink: 0,
          }}
        >
          {session?.user?.email?.[0]?.toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: C.ink, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session?.user?.email}</p>
          {profile?.is_pro ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem', fontSize: '0.75rem', color: C.clay, fontFamily: F.sans, fontWeight: 600 }}>
              <Crown size={13} strokeWidth={2} /> Atlas Pro
            </span>
          ) : (
            <p style={{ color: C.slate, fontSize: '0.8rem', marginTop: '0.2rem' }}>Free plan</p>
          )}
        </div>
      </Card>

      <SectionLabel>Money</SectionLabel>

      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <IconBadge icon={Banknote} />
          <span style={{ color: C.ink, fontSize: '0.95rem', fontWeight: 500 }}>Monthly income</span>
        </div>
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
          <Button style={{ height: 'fit-content' }} onClick={handleSaveIncome}>
            Save
          </Button>
        </div>
        {incomeError && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{incomeError}</p>}
      </Card>

      <BaselineListCard
        title="Accounts & balances"
        emptyHint="Unlocks net worth and emergency-fund runway."
        items={accounts}
        getIcon={(a) => ACCOUNT_ICONS[a.kind] ?? Wallet}
        renderItem={(a) => `${a.name} — ${formatRands(a.balance_cents)}`}
        renderSub={(a) => a.kind}
        onAdd={handleUpsertAccount}
        onDelete={handleRemoveAccount}
        error={accountsError}
        kindOptions={['checking', 'savings', 'investment', 'other']}
      />

      <DebtsCard debts={debts} onAdd={handleUpsertDebt} onDelete={handleRemoveDebt} error={debtsError} />

      <SectionLabel>Your data</SectionLabel>

      <Card style={{ marginBottom: '1rem' }}>
        <Button variant="secondary" onClick={handleExport} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Download size={16} strokeWidth={2} /> Download my data
        </Button>
      </Card>
    </div>
  );
}

function BaselineListCard({ title, emptyHint, items, getIcon, renderItem, renderSub, onAdd, onDelete, error, kindOptions }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState(kindOptions[0]);
  const [balance, setBalance] = useState('');

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="label">{title}</span>
        <Button variant="ghost" onClick={() => setAdding((v) => !v)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
          {adding ? 'Cancel' : '+ Add'}
        </Button>
      </div>
      {items.length === 0 && !adding && <p style={{ color: C.slate, fontSize: '0.85rem', margin: '0.4rem 0' }}>{emptyHint}</p>}
      {items.map((item) => {
        const Icon = getIcon(item);
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderTop: `1px solid ${C.line}` }}>
            <IconBadge icon={Icon} />
            <div style={{ flex: 1 }}>
              <p style={{ color: C.ink, fontSize: '0.9rem' }}>{renderItem(item)}</p>
              {renderSub && <p style={{ color: C.slate, fontSize: '0.75rem', textTransform: 'capitalize' }}>{renderSub(item)}</p>}
            </div>
            <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', color: C.slate }}>✕</button>
          </div>
        );
      })}
      {adding && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ flex: 2, minWidth: '90px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
            <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }}>
              {kindOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" placeholder="R" style={{ flex: 1, minWidth: '70px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
            <Button
              onClick={() => { if (name && balance) { onAdd(name, kind, balance); setName(''); setBalance(''); setAdding(false); } }}
            >
              Add
            </Button>
          </div>
        </div>
      )}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
    </Card>
  );
}

function DebtsCard({ debts, onAdd, onDelete, error }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [payment, setPayment] = useState('');

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="label">Debts</span>
        <Button variant="ghost" onClick={() => setAdding((v) => !v)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
          {adding ? 'Cancel' : '+ Add'}
        </Button>
      </div>
      {debts.length === 0 && !adding && (
        <p style={{ color: C.slate, fontSize: '0.85rem', margin: '0.4rem 0' }}>
          Unlocks debt payoff projections and interest-cost awareness.
        </p>
      )}
      {debts.map((d) => {
        const result = d.monthly_payment_cents ? debtAmortization(d) : null;
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.5rem 0', borderTop: `1px solid ${C.line}` }}>
            <IconBadge icon={CreditCard} color={C.over} background="rgba(168, 83, 74, 0.1)" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.ink, fontSize: '0.9rem' }}>{d.name} — {formatRands(d.balance_cents)} @ {d.apr}%</span>
                <button onClick={() => onDelete(d.id)} style={{ background: 'none', border: 'none', color: C.slate }}>✕</button>
              </div>
              {result && (
                <p style={{ color: C.slate, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {result.amortizing
                    ? `${result.months} months to pay off, ~${formatRands(result.totalInterestCents)} in interest at this payment.`
                    : 'At this payment, this debt will never be paid off — your payment doesn\'t cover the interest.'}
                </p>
              )}
            </div>
          </div>
        );
      })}
      {adding && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ flex: 2, minWidth: '80px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
            <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" placeholder="Balance (R)" style={{ flex: 1, minWidth: '90px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
            <input value={apr} onChange={(e) => setApr(e.target.value)} type="number" placeholder="APR %" style={{ flex: 1, minWidth: '70px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
            <input value={payment} onChange={(e) => setPayment(e.target.value)} type="number" placeholder="Payment/mo (R)" style={{ flex: 1, minWidth: '100px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${C.line}` }} />
            <Button
              onClick={() => {
                if (!name || !balance || !apr) return;
                onAdd({
                  name,
                  balance_cents: randsToCents(Number(balance)),
                  apr: Number(apr),
                  monthly_payment_cents: payment ? randsToCents(Number(payment)) : null,
                });
                setName(''); setBalance(''); setApr(''); setPayment(''); setAdding(false);
              }}
            >
              Add
            </Button>
          </div>
        </div>
      )}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
    </Card>
  );
}
