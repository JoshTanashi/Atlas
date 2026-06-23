import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  User, Crown, Lock, MessageSquare, Info, LogOut, Trash2, Sun, Check,
  Landmark, PiggyBank, TrendingUp, Wallet, CreditCard, Download, Banknote, Target,
} from 'lucide-react';
import { C, F } from '../tokens.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { SettingsGroup, SettingsGroupList } from '../components/ui/SettingsGroup.jsx';
import { SettingsRow, SettingsRowExpand } from '../components/ui/SettingsRow.jsx';
import { ProPlansModal } from '../components/pro/ProPlansModal.jsx';
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

function IconBadge({ icon: Icon, color = C.sageDeep, background = C.cream }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background, flexShrink: 0 }}>
      <Icon size={16} strokeWidth={2} color={color} />
    </span>
  );
}

export function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { profile, updateDisplayName } = useProfile();
  const { income, budget, accounts, debts, setMonthlyIncome, setMonthlyBudget, upsertAccount, deleteAccount, upsertDebt, deleteDebt } = useBaseline();
  const { events } = useEvents();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(null);
  const [proModalOpen, setProModalOpen] = useState(false);

  function toggle(id) {
    setExpanded((cur) => (cur === id ? null : id));
  }

  function describeBaselineError(e) {
    return e.message === 'OFFLINE' ? "You're offline — connect to save changes." : 'Could not save. Please try again.';
  }

  const currentThemeLabel = THEMES.find((t) => t.id === theme)?.label ?? 'Light';

  return (
    <div>
      <ScreenHeader title="Settings" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.5rem' }}>
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
      </div>

      <SettingsGroupList>
        <SettingsGroup label="About me">
          <SettingsRow
            icon={User}
            label="Display name"
            value={profile?.display_name || 'Not set'}
            chevron
            onClick={() => toggle('name')}
          />
          <AnimatePresence initial={false}>
            {expanded === 'name' && (
              <SettingsRowExpand>
                <DisplayNamePanel displayName={profile?.display_name} onSave={updateDisplayName} />
              </SettingsRowExpand>
            )}
          </AnimatePresence>
        </SettingsGroup>

        <SettingsGroup label="Plans & pricing">
          <SettingsRow
            icon={Crown}
            label="Atlas Pro"
            pill={profile?.is_pro ? (profile.pro_plan ? `${profile.pro_plan[0].toUpperCase()}${profile.pro_plan.slice(1)}` : 'Pro') : 'Free'}
            chevron
            onClick={() => setProModalOpen(true)}
          />
        </SettingsGroup>

        <SettingsGroup label="General settings">
          <SettingsRow icon={Sun} label="Theme" value={currentThemeLabel} chevron onClick={() => toggle('theme')} />
          <AnimatePresence initial={false}>
            {expanded === 'theme' && <SettingsRowExpand><ThemePanel /></SettingsRowExpand>}
          </AnimatePresence>

          <SettingsRow
            icon={Download}
            label="Download my data"
            onClick={() => exportData({ events, income, accounts, debts })}
          />
        </SettingsGroup>

        <SettingsGroup label="Money">
          <SettingsRow
            icon={Banknote}
            label="Monthly income"
            value={income ? formatRands(income.monthly_income_cents) : 'Not set'}
            chevron
            onClick={() => toggle('income')}
          />
          <AnimatePresence initial={false}>
            {expanded === 'income' && (
              <SettingsRowExpand>
                <IncomePanel income={income} setMonthlyIncome={setMonthlyIncome} describeBaselineError={describeBaselineError} />
              </SettingsRowExpand>
            )}
          </AnimatePresence>

          <SettingsRow
            icon={Target}
            label="Monthly budget"
            value={budget ? formatRands(budget.monthly_budget_cents) : 'Not set'}
            chevron
            onClick={() => toggle('budget')}
          />
          <AnimatePresence initial={false}>
            {expanded === 'budget' && (
              <SettingsRowExpand>
                <BudgetPanel budget={budget} setMonthlyBudget={setMonthlyBudget} describeBaselineError={describeBaselineError} />
              </SettingsRowExpand>
            )}
          </AnimatePresence>

          <SettingsRow
            icon={Landmark}
            label="Accounts & balances"
            value={accounts.length ? `${accounts.length}` : 'None'}
            chevron
            onClick={() => toggle('accounts')}
          />
          <AnimatePresence initial={false}>
            {expanded === 'accounts' && (
              <SettingsRowExpand>
                <AccountsPanel accounts={accounts} upsertAccount={upsertAccount} deleteAccount={deleteAccount} describeBaselineError={describeBaselineError} />
              </SettingsRowExpand>
            )}
          </AnimatePresence>

          <SettingsRow
            icon={CreditCard}
            label="Debts"
            value={debts.length ? `${debts.length}` : 'None'}
            chevron
            onClick={() => toggle('debts')}
          />
          <AnimatePresence initial={false}>
            {expanded === 'debts' && (
              <SettingsRowExpand>
                <DebtsPanel debts={debts} upsertDebt={upsertDebt} deleteDebt={deleteDebt} describeBaselineError={describeBaselineError} />
              </SettingsRowExpand>
            )}
          </AnimatePresence>
        </SettingsGroup>

        {session && (
          <SettingsGroup label="Security">
            <SettingsRow icon={Lock} label="Change password" chevron onClick={() => toggle('password')} />
            <AnimatePresence initial={false}>
              {expanded === 'password' && <SettingsRowExpand><PasswordPanel /></SettingsRowExpand>}
            </AnimatePresence>
          </SettingsGroup>
        )}

        <SettingsGroup label="Contact Us">
          <SettingsRow icon={MessageSquare} label="Send feedback" chevron onClick={() => toggle('feedback')} />
          <AnimatePresence initial={false}>
            {expanded === 'feedback' && <SettingsRowExpand><FeedbackPanel userId={session?.user?.id} /></SettingsRowExpand>}
          </AnimatePresence>

          <SettingsRow icon={Info} label="Atlas" value="v1.0" />
        </SettingsGroup>

        <SettingsGroup label="Account">
          {session ? (
            <SettingsRow icon={LogOut} label="Sign out" onClick={signOut} />
          ) : (
            <SettingsRow icon={User} label="Create an account" chevron onClick={() => navigate('/sign-up')} />
          )}
          <AccountDangerRow session={session} signOut={signOut} />
        </SettingsGroup>
      </SettingsGroupList>

      <AnimatePresence>
        {proModalOpen && (
          <ProPlansModal onClose={() => setProModalOpen(false)} profile={profile} session={session} />
        )}
      </AnimatePresence>
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

function AccountDangerRow({ session, signOut }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleDeleteAccount() {
    if (!window.confirm('This permanently deletes your account and all data. This cannot be undone. Continue?')) return;
    setBusy(true);
    setError(null);
    try {
      const { error: invokeError } = await supabase.functions.invoke('delete-account');
      if (invokeError) throw invokeError;
      await signOut();
    } catch {
      setError('Could not delete your account. Please try again, or contact support.');
      setBusy(false);
    }
  }

  async function handleClearLocalData() {
    if (!window.confirm('This permanently deletes everything saved on this device. This cannot be undone. Continue?')) return;
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SettingsRow
        icon={Trash2}
        label={busy ? 'Working…' : session ? 'Delete my account and all data' : 'Clear all local data'}
        danger
        onClick={session ? handleDeleteAccount : handleClearLocalData}
      />
      {error && <p style={{ color: C.over, fontSize: '0.85rem', padding: '0 1rem 0.85rem' }}>{error}</p>}
    </>
  );
}

function DisplayNamePanel({ displayName, onSave }) {
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
    <div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Your name" />
        <Button style={{ height: 'fit-content' }} onClick={handleSave}>Save</Button>
      </div>
      {saved && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Saved.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </div>
  );
}

function ThemePanel() {
  const { theme, setTheme } = useTheme();

  return (
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
  );
}

function IncomePanel({ income, setMonthlyIncome, describeBaselineError }) {
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeError, setIncomeError] = useState(null);

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

  return (
    <div>
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
        <Button style={{ height: 'fit-content' }} onClick={handleSaveIncome}>Save</Button>
      </div>
      {incomeError && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{incomeError}</p>}
    </div>
  );
}

function BudgetPanel({ budget, setMonthlyBudget, describeBaselineError }) {
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState(null);

  async function handleSaveBudget() {
    if (!budgetInput) return;
    setBudgetError(null);
    try {
      await setMonthlyBudget(randsToCents(Number(budgetInput)));
      setBudgetInput('');
    } catch (e) {
      setBudgetError(describeBaselineError(e));
    }
  }

  return (
    <div>
      <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        {budget ? `Currently ${formatRands(budget.monthly_budget_cents)}/month` : 'Not set — unlocks a spending cap and progress bar.'}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Input
          type="number"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          placeholder={budget ? centsToRands(budget.monthly_budget_cents).toString() : 'R per month'}
        />
        <Button style={{ height: 'fit-content' }} onClick={handleSaveBudget}>Save</Button>
      </div>
      {budgetError && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{budgetError}</p>}
    </div>
  );
}

function AccountsPanel({ accounts, upsertAccount, deleteAccount, describeBaselineError }) {
  const [error, setError] = useState(null);

  async function handleAdd(name, kind, balanceRands) {
    setError(null);
    try {
      await upsertAccount({ name, kind, balance_cents: randsToCents(Number(balanceRands)) });
    } catch (e) {
      setError(describeBaselineError(e));
    }
  }

  async function handleRemove(id) {
    setError(null);
    try {
      await deleteAccount(id);
    } catch (e) {
      setError(describeBaselineError(e));
    }
  }

  return (
    <BaselineList
      emptyHint="Unlocks net worth and emergency-fund runway."
      items={accounts}
      getIcon={(a) => ACCOUNT_ICONS[a.kind] ?? Wallet}
      renderItem={(a) => `${a.name} — ${formatRands(a.balance_cents)}`}
      renderSub={(a) => a.kind}
      onAdd={handleAdd}
      onDelete={handleRemove}
      error={error}
      kindOptions={['checking', 'savings', 'investment', 'other']}
    />
  );
}

function BaselineList({ emptyHint, items, getIcon, renderItem, renderSub, onAdd, onDelete, error, kindOptions }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState(kindOptions[0]);
  const [balance, setBalance] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="label">{items.length} saved</span>
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
    </div>
  );
}

function DebtsPanel({ debts, upsertDebt, deleteDebt, describeBaselineError }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [payment, setPayment] = useState('');
  const [error, setError] = useState(null);

  async function handleAdd() {
    if (!name || !balance || !apr) return;
    setError(null);
    try {
      await upsertDebt({
        name,
        balance_cents: randsToCents(Number(balance)),
        apr: Number(apr),
        monthly_payment_cents: payment ? randsToCents(Number(payment)) : null,
      });
      setName(''); setBalance(''); setApr(''); setPayment(''); setAdding(false);
    } catch (e) {
      setError(describeBaselineError(e));
    }
  }

  async function handleRemove(id) {
    setError(null);
    try {
      await deleteDebt(id);
    } catch (e) {
      setError(describeBaselineError(e));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="label">{debts.length} saved</span>
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
                <button onClick={() => handleRemove(d.id)} style={{ background: 'none', border: 'none', color: C.slate }}>✕</button>
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
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </div>
      )}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}

function PasswordPanel() {
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
    <div>
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
      <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
      <Button onClick={handleSave} style={{ width: '100%' }}>Update password</Button>
      {saved && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Password updated.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </div>
  );
}

function FeedbackPanel({ userId }) {
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
    <div>
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
    </div>
  );
}
