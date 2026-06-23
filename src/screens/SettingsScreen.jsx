import { useState } from 'react';
import {
  User, Crown, Lock, MessageSquare, Info, LogOut, Trash2, Sun, Check,
  Landmark, PiggyBank, TrendingUp, Wallet, CreditCard, Download, Banknote,
} from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { friendlyAuthError } from '../lib/authError.js';
import { navigate } from '../lib/nav.js';
import { formatRands, randsToCents, centsToRands } from '../lib/money.js';
import { debtAmortization } from '../lib/formulas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useBaseline } from '../hooks/useBaseline.js';
import { useEvents } from '../hooks/useEvents.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import { useTheme, THEMES } from '../hooks/useTheme.jsx';
import { supabase } from '../lib/supabaseClient.js';

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

function CardHeader({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
      <IconBadge icon={icon} />
      <span style={{ color: C.ink, fontSize: '0.95rem', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { profile, updateDisplayName } = useProfile();
  const { income, accounts, debts, setMonthlyIncome, upsertAccount, deleteAccount, upsertDebt, deleteDebt } = useBaseline();
  const { events } = useEvents();

  function describeBaselineError(e) {
    return e.message === 'OFFLINE' ? "You're offline — connect to save changes." : 'Could not save. Please try again.';
  }

  return (
    <div>
      <ScreenHeader title="Settings" />

      <Card style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <span
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '3rem', height: '3rem', borderRadius: '50%',
            background: C.sage, color: C.paper, fontFamily: F.serif, fontSize: '1.3rem', flexShrink: 0,
          }}
        >
          {session ? session.user.email[0].toUpperCase() : 'G'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: C.ink, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session ? session.user.email : 'Guest'}
          </p>
          {!session ? (
            <p style={{ color: C.slate, fontSize: '0.8rem', marginTop: '0.2rem' }}>Saved on this device only</p>
          ) : profile?.is_pro ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem', fontSize: '0.75rem', color: C.clay, fontFamily: F.sans, fontWeight: 600 }}>
              <Crown size={13} strokeWidth={2} /> Atlas Pro
            </span>
          ) : (
            <p style={{ color: C.slate, fontSize: '0.8rem', marginTop: '0.2rem' }}>Free plan</p>
          )}
        </div>
      </Card>

      <SectionLabel>Profile</SectionLabel>
      <ProfileCard displayName={profile?.display_name} onSave={updateDisplayName} />

      <SectionLabel>Plans & pricing</SectionLabel>
      <PricingCard profile={profile} session={session} />

      <SectionLabel>Appearance</SectionLabel>
      <AppearanceCard />

      <SectionLabel>Money</SectionLabel>
      <MoneySection
        income={income}
        accounts={accounts}
        debts={debts}
        setMonthlyIncome={setMonthlyIncome}
        upsertAccount={upsertAccount}
        deleteAccount={deleteAccount}
        upsertDebt={upsertDebt}
        deleteDebt={deleteDebt}
        describeBaselineError={describeBaselineError}
      />

      <SectionLabel>Your data</SectionLabel>
      <Card style={{ marginBottom: '1rem' }}>
        <Button
          variant="secondary"
          onClick={() => exportData({ events, income, accounts, debts })}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Download size={16} strokeWidth={2} /> Download my data
        </Button>
      </Card>

      {session && (
        <>
          <SectionLabel>Security</SectionLabel>
          <PasswordCard />
        </>
      )}

      <SectionLabel>Feedback</SectionLabel>
      <FeedbackCard userId={session?.user?.id} />

      <SectionLabel>About</SectionLabel>
      <Card style={{ marginBottom: '1rem' }}>
        <CardHeader icon={Info} label="Atlas" />
        <p style={{ color: C.slate, fontSize: '0.85rem' }}>Version 1.0 — a calm, honest journal for your money.</p>
      </Card>

      <SectionLabel>Account</SectionLabel>
      <AccountCard session={session} signOut={signOut} />
    </div>
  );
}

function exportData({ events, income, accounts, debts }) {
  const payload = { exportedAt: new Date().toISOString(), events, income, accounts, debts };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atlas-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function AccountCard({ session, signOut }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [clearing, setClearing] = useState(false);

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

  async function handleClearLocalData() {
    if (!window.confirm('This permanently deletes everything saved on this device. This cannot be undone. Continue?')) return;
    setClearing(true);
    try {
      await signOut();
    } finally {
      setClearing(false);
    }
  }

  if (!session) {
    return (
      <Card style={{ marginBottom: '1rem' }}>
        <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Your data is saved only on this device. Create an account to back it up and sync across devices.
        </p>
        <Button onClick={() => navigate('/sign-up')} style={{ width: '100%', marginBottom: '0.5rem' }}>
          Create an account
        </Button>
        <Button
          variant="ghost"
          onClick={handleClearLocalData}
          disabled={clearing}
          style={{ width: '100%', color: C.over, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Trash2 size={16} strokeWidth={2} /> {clearing ? 'Clearing…' : 'Clear all local data'}
        </Button>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <Button variant="ghost" onClick={signOut} style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <LogOut size={16} strokeWidth={2} /> Sign out
      </Button>
      {deleteError && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{deleteError}</p>}
      <Button
        variant="ghost"
        onClick={handleDeleteAccount}
        disabled={deleting}
        style={{ width: '100%', color: C.over, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <Trash2 size={16} strokeWidth={2} /> {deleting ? 'Deleting…' : 'Delete my account and all data'}
      </Button>
    </Card>
  );
}

function ProfileCard({ displayName, onSave }) {
  const [name, setName] = useState(displayName ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await onSave(name);
      setSaved(true);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to save changes." : 'Could not save. Please try again.');
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={User} label="Display name" />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Your name" />
        <Button style={{ height: 'fit-content' }} onClick={handleSave}>Save</Button>
      </div>
      {saved && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Saved.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </Card>
  );
}

const FREE_FEATURES = [
  'Unlimited manual journal entries',
  'Accounts, debts & goal tracking',
  'Savings rate & net worth on the dashboard',
  'Cloud sync across your devices',
];

const PRO_FEATURES = [
  'Everything in Free',
  'AI-generated spending insights',
  'Next-month spend forecast',
  'Category breakdown of where money goes',
];

const MONTHLY_CENTS = 9900;
const YEARLY_CENTS = 99900;
const YEARLY_SAVINGS_CENTS = MONTHLY_CENTS * 12 - YEARLY_CENTS;

function FeatureList({ items }) {
  return (
    <ul style={{ listStyle: 'none', margin: '0.75rem 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: C.slate, fontSize: '0.85rem' }}>
          <Check size={14} strokeWidth={2.5} color={C.sageDeep} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function PricingCard({ profile, session }) {
  const [plan, setPlan] = useState('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  if (profile?.is_pro) {
    const planLabel = profile?.pro_plan ? `${profile.pro_plan[0].toUpperCase()}${profile.pro_plan.slice(1)}` : 'Pro access';
    const renewal = profile?.pro_current_period_end
      ? new Date(profile.pro_current_period_end).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;

    return (
      <Card style={{ marginBottom: '1rem' }}>
        <CardHeader icon={Crown} label="Atlas Pro" />
        <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {planLabel}{renewal ? ` — renews ${renewal}` : ''}
        </p>
        <FeatureList items={PRO_FEATURES} />
      </Card>
    );
  }

  async function handleUpgrade() {
    if (!session) {
      navigate('/sign-up');
      return;
    }
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { plan: plan === 'annual' ? 'yearly' : 'monthly' } });
      if (error) throw error;
      window.location.href = data.url;
    } catch (e) {
      setCheckoutError(e.message === 'OFFLINE' ? "You're offline — connect to upgrade." : 'Could not start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', border: `1px solid ${C.line}` }}>
          <span className="label">Free</span>
          <p style={{ fontFamily: F.serif, fontSize: '1.3rem', color: C.ink, margin: '0.3rem 0' }}>R0</p>
          <FeatureList items={FREE_FEATURES} />
        </div>
        <div style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', border: `1.5px solid ${C.sageDeep}`, background: C.cream }}>
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Crown size={13} strokeWidth={2} color={C.clay} /> Pro
          </span>
          <p style={{ fontFamily: F.serif, fontSize: '1.3rem', color: C.ink, margin: '0.3rem 0' }}>
            {formatRands(plan === 'annual' ? YEARLY_CENTS / 12 : MONTHLY_CENTS)}<span style={{ fontSize: '0.75rem', color: C.slate }}>/mo</span>
          </p>
          <FeatureList items={PRO_FEATURES} />
        </div>
      </div>

      <div style={{ display: 'flex', borderRadius: '10px', border: `1px solid ${C.line}`, padding: '0.2rem', marginBottom: '0.75rem' }}>
        {['monthly', 'annual'].map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: plan === p ? C.sageDeep : 'transparent',
              color: plan === p ? C.paper : C.slate,
              fontFamily: F.sans, fontSize: '0.85rem', fontWeight: 500,
            }}
          >
            {p === 'monthly' ? 'Monthly' : `Annual — save ${formatRands(YEARLY_SAVINGS_CENTS)}`}
          </button>
        ))}
      </div>

      <Button onClick={handleUpgrade} disabled={checkoutLoading} style={{ width: '100%' }}>
        {!session
          ? 'Create an account to go Pro'
          : checkoutLoading
            ? 'Redirecting…'
            : plan === 'annual' ? `Go Pro — ${formatRands(YEARLY_CENTS)}/year` : `Go Pro — ${formatRands(MONTHLY_CENTS)}/month`}
      </Button>
      {checkoutError && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{checkoutError}</p>}
    </Card>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={Sun} label="Theme" />
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                flex: 1,
                textAlign: 'left',
                padding: '0.75rem',
                borderRadius: '12px',
                border: `1.5px solid ${active ? C.sageDeep : C.line}`,
                background: C.paper,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: C.ink, fontSize: '0.9rem', fontWeight: 500 }}>{t.label}</span>
                {active && <Check size={15} strokeWidth={2.5} color={C.sageDeep} />}
              </div>
              <p style={{ color: C.slate, fontSize: '0.75rem' }}>{t.description}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function MoneySection({ income, accounts, debts, setMonthlyIncome, upsertAccount, deleteAccount, upsertDebt, deleteDebt, describeBaselineError }) {
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeError, setIncomeError] = useState(null);
  const [accountsError, setAccountsError] = useState(null);
  const [debtsError, setDebtsError] = useState(null);

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

  return (
    <>
      <Card style={{ marginBottom: '1rem' }}>
        <CardHeader icon={Banknote} label="Monthly income" />
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
    </>
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

function PasswordCard() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirm('');
      setSaved(true);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to change your password." : friendlyAuthError(e.message));
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={Lock} label="Change password" />
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
      <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
      <Button onClick={handleSave} style={{ width: '100%' }}>Update password</Button>
      {saved && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Password updated.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </Card>
  );
}

function FeedbackCard({ userId }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend() {
    if (!message.trim()) return;
    setError(null);
    if (!userId) {
      setError('Create an account to send feedback.');
      return;
    }
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { error: insertError } = await supabase.from('feedback').insert({ user_id: userId, message: message.trim() });
      if (insertError) throw insertError;
      setMessage('');
      setSent(true);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to send feedback." : 'Could not send feedback. Please try again.');
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={MessageSquare} label="Send feedback" />
      <textarea
        value={message}
        onChange={(e) => { setMessage(e.target.value); setSent(false); }}
        placeholder="What's working, what's not — tell us anything."
        rows={3}
        style={{
          width: '100%',
          fontFamily: F.sans,
          fontSize: '0.95rem',
          padding: '0.75rem 0.9rem',
          borderRadius: '10px',
          border: `1px solid ${C.line}`,
          background: C.paper,
          color: C.ink,
          outline: 'none',
          resize: 'vertical',
          marginBottom: '0.75rem',
        }}
      />
      <Button onClick={handleSend} style={{ width: '100%' }}>Send</Button>
      {sent && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Thanks — we read every one.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </Card>
  );
}
