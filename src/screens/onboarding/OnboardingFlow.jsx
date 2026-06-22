import { useState } from 'react';
import {
  Wallet, Target, Sparkles, ShieldCheck, Repeat, Landmark,
  CreditCard, Home, Clock, Settings, ChevronRight, Check,
} from 'lucide-react';
import { C, F } from '../../tokens.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { formatRands, randsToCents } from '../../lib/money.js';
import { useProfile } from '../../hooks/useProfile.jsx';
import { useBaseline } from '../../hooks/useBaseline.js';
import { useRecurringExpenses } from '../../hooks/useRecurringExpenses.js';
import { useGoals } from '../../hooks/useGoals.js';
import { navigate } from '../../lib/nav.js';

const STEPS = ['intro', 'income', 'recurring', 'accounts', 'debts', 'goal', 'tutorial'];

function describeError(e) {
  return e.message === 'OFFLINE' ? "You're offline — you can add this later from Settings." : 'Could not save. You can add this later from Settings.';
}

export function OnboardingFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const { completeOnboarding } = useProfile();

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function finish() {
    try {
      await completeOnboarding();
    } catch {
      // Onboarding still ends even if this fails to save — it'll just be asked again.
    }
    navigate('/');
  }

  const step = STEPS[stepIndex];

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {step !== 'intro' && <ProgressBar current={stepIndex} total={STEPS.length} />}
      <div style={{ flex: 1, padding: '1.5rem 1.25rem 2.5rem', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {step === 'intro' && <IntroStep onNext={next} />}
        {step === 'income' && <IncomeStep onNext={next} />}
        {step === 'recurring' && <RecurringStep onNext={next} />}
        {step === 'accounts' && <AccountsStep onNext={next} />}
        {step === 'debts' && <DebtsStep onNext={next} />}
        {step === 'goal' && <GoalStep onNext={next} />}
        {step === 'tutorial' && <TutorialStep onFinish={finish} />}
      </div>
    </div>
  );
}

function ProgressBar({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: '0.3rem', padding: '1.25rem 1.25rem 0', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {Array.from({ length: total - 1 }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '4px',
            borderRadius: '2px',
            background: i <= current - 1 ? C.sageDeep : C.line,
            transition: 'background 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

function StepHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink, marginBottom: '0.5rem' }}>{title}</h1>
      {subtitle && <p style={{ color: C.slate, fontSize: '0.9rem', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

function StepFooter({ onSkip, onContinue, continueLabel = 'Continue', continueDisabled, error }) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
      <Button onClick={onContinue} disabled={continueDisabled} style={{ width: '100%', marginBottom: '0.6rem' }}>
        {continueLabel}
      </Button>
      {onSkip && (
        <Button variant="ghost" onClick={onSkip} style={{ width: '100%' }}>
          Skip for now
        </Button>
      )}
    </div>
  );
}

function PillGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: '1 1 auto',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              border: `1.5px solid ${active ? C.sageDeep : C.line}`,
              background: active ? C.sageDeep : C.paper,
              color: active ? C.paper : C.ink,
              fontFamily: F.sans,
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const BENEFITS = [
  { icon: Wallet, text: 'Log spending in seconds and see where your money actually goes.' },
  { icon: Target, text: 'Set savings goals and watch your progress build automatically.' },
  { icon: Sparkles, text: 'Pro unlocks AI insights and a forecast of your month ahead.' },
  { icon: ShieldCheck, text: 'Your data is private, encrypted, and yours to export any time.' },
];

function IntroStep({ onNext }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ fontFamily: F.serif, fontSize: '2rem', color: C.ink, marginBottom: '0.5rem' }}>Welcome to Atlas</p>
        <p style={{ color: C.slate, fontSize: '0.95rem', lineHeight: 1.5 }}>
          A calm, honest journal for your money. A few quick questions will help Atlas understand your finances
          so it can work for you from day one.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
        {BENEFITS.map(({ icon: Icon, text }) => (
          <Card key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: C.cream, flexShrink: 0 }}>
              <Icon size={18} strokeWidth={2} color={C.sageDeep} />
            </span>
            <p style={{ color: C.ink, fontSize: '0.88rem', lineHeight: 1.4, paddingTop: '0.2rem' }}>{text}</p>
          </Card>
        ))}
      </div>
      <Button onClick={onNext} style={{ width: '100%' }}>Get started</Button>
    </div>
  );
}

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'irregular', label: 'Irregular' },
];

function IncomeStep({ onNext }) {
  const { setMonthlyIncome } = useBaseline();
  const [incomeType, setIncomeType] = useState('fixed');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [payDay, setPayDay] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleContinue() {
    if (!amount) {
      onNext();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setMonthlyIncome(randsToCents(Number(amount)), {
        income_type: incomeType,
        pay_frequency: frequency,
        pay_day: frequency === 'irregular' || !payDay ? null : Number(payDay),
      });
      onNext();
    } catch (e) {
      setError(describeError(e));
      setSaving(false);
    }
  }

  return (
    <div>
      <StepHeading
        title="Your income"
        subtitle="This helps Atlas calculate your savings rate and forecast the rest of your month."
      />

      <span className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Is your income fixed or variable?</span>
      <PillGroup
        options={[{ value: 'fixed', label: 'Fixed' }, { value: 'variable', label: 'Variable' }]}
        value={incomeType}
        onChange={setIncomeType}
      />

      <Input
        label="Monthly income (after tax)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="e.g. 28000"
      />

      <span className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>How often do you get paid?</span>
      <PillGroup options={FREQUENCIES} value={frequency} onChange={setFrequency} />

      {frequency !== 'irregular' && (
        <Input
          label="Day of the month you get paid"
          type="number"
          value={payDay}
          onChange={(e) => setPayDay(e.target.value)}
          placeholder="e.g. 25"
        />
      )}

      <StepFooter onSkip={onNext} onContinue={handleContinue} continueDisabled={saving} error={error} />
    </div>
  );
}

const EXPENSE_CATEGORIES = ['subscriptions', 'transport', 'health', 'shopping', 'airtime_data', 'uncategorized'];

function RecurringStep({ onNext }) {
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

const ACCOUNT_KINDS = ['checking', 'savings', 'investment', 'other'];

function AccountsStep({ onNext }) {
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

function DebtsStep({ onNext }) {
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

function GoalStep({ onNext }) {
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

const TUTORIAL_SLIDES = [
  { icon: Home, label: 'Home', text: 'Your dashboard — spending, income, and savings rate for the month, at a glance.' },
  { icon: Clock, label: 'Timeline', text: 'Every entry you log, in order, so you can always see and search where money went.' },
  { icon: Target, label: 'Goals', text: 'Set targets and watch your progress build automatically as you save.' },
  { icon: Sparkles, label: 'Insights', text: 'AI-generated insights and a forecast of your month ahead — a Pro feature.' },
  { icon: Settings, label: 'Settings', text: 'Your plan, accounts, debts, theme, and account security all live here.' },
];

function TutorialStep({ onFinish }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === TUTORIAL_SLIDES.length - 1;
  const { icon: Icon, label, text } = TUTORIAL_SLIDES[slide];

  return (
    <div>
      <StepHeading title="A quick tour" subtitle="Here's what each part of Atlas does." />

      <Card style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem 1.5rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: C.cream, marginBottom: '1rem' }}>
          <Icon size={26} strokeWidth={2} color={C.sageDeep} />
        </span>
        <p style={{ fontFamily: F.serif, fontSize: '1.2rem', color: C.ink, marginBottom: '0.5rem' }}>{label}</p>
        <p style={{ color: C.slate, fontSize: '0.88rem', lineHeight: 1.5 }}>{text}</p>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
        {TUTORIAL_SLIDES.map((_, i) => (
          <span key={i} style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: i === slide ? C.sageDeep : C.line }} />
        ))}
      </div>

      <Button
        onClick={() => (isLast ? onFinish() : setSlide((s) => s + 1))}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
      >
        {isLast ? <>Start using Atlas <Check size={16} strokeWidth={2.5} /></> : <>Next <ChevronRight size={16} strokeWidth={2.5} /></>}
      </Button>
    </div>
  );
}
