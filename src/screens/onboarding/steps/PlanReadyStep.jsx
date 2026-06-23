import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { formatRands } from '../../../lib/money.js';
import { savingsRate, netWorth } from '../../../lib/formulas.js';
import { useBaseline } from '../../../hooks/useBaseline.js';
import { useRecurringExpenses } from '../../../hooks/useRecurringExpenses.js';
import { useGoals } from '../../../hooks/useGoals.js';

function Stat({ label, value, detail, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <Card style={{ marginBottom: '0.75rem' }}>
        <p style={{ color: C.slate, fontSize: '0.78rem', marginBottom: '0.3rem' }}>{label}</p>
        <p style={{ fontFamily: F.serif, fontSize: '1.5rem', color: C.ink, marginBottom: detail ? '0.3rem' : 0 }}>{value}</p>
        {detail && <p style={{ color: C.slate, fontSize: '0.8rem', lineHeight: 1.4 }}>{detail}</p>}
      </Card>
    </motion.div>
  );
}

// Personalized reveal shown right after the goal step — built only from numbers
// the user just entered (income, recurring bills, accounts/debts, first goal),
// never illustrative data, so it's an honest snapshot rather than a sales pitch.
export function PlanReadyStep({ onNext }) {
  const { income, accounts, debts } = useBaseline();
  const { recurringExpenses } = useRecurringExpenses();
  const { goals } = useGoals();

  const recurringTotalCents = recurringExpenses.reduce((sum, e) => sum + e.amount_cents, 0);
  const hasIncome = Boolean(income?.monthly_income_cents);
  const hasAccountsOrDebts = accounts.length > 0 || debts.length > 0;
  const goal = goals[0] ?? null;

  const rate = hasIncome ? savingsRate(income.monthly_income_cents, recurringTotalCents) : null;
  const worth = hasAccountsOrDebts ? netWorth(accounts, debts) : null;
  const surplusCents = hasIncome ? income.monthly_income_cents - recurringTotalCents : null;

  let goalDetail = null;
  if (goal && surplusCents > 0) {
    const remainingCents = goal.target_cents - goal.saved_cents;
    if (remainingCents > 0) {
      const months = Math.max(1, Math.ceil(remainingCents / surplusCents));
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + months);
      goalDetail = `At that pace, ${goal.name} could be funded by ${projectedDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}.`;
    }
  }

  const hasAnyStat = hasIncome || hasAccountsOrDebts || Boolean(goal);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ textAlign: 'center', marginBottom: '1.5rem' }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '3rem', height: '3rem', borderRadius: '50%', background: C.paper,
            border: `1px solid ${C.line}`, marginBottom: '0.9rem',
          }}
        >
          <Sparkles size={20} strokeWidth={2} color={C.sageDeep} />
        </span>
        <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', color: C.ink, marginBottom: '0.5rem' }}>Your starting point</h1>
        <p style={{ color: C.slate, fontSize: '0.9rem', lineHeight: 1.5 }}>
          {hasAnyStat ? "Built from what you've just told Atlas." : 'A blank slate — add the rest anytime from Settings.'}
        </p>
      </motion.div>

      {hasAccountsOrDebts && <Stat label="Net worth today" value={formatRands(worth)} delay={0.05} />}

      {hasIncome && (
        <Stat
          label="Estimated monthly savings rate"
          value={rate === null ? '—' : `${(rate * 100).toFixed(0)}%`}
          detail={
            surplusCents > 0
              ? `About ${formatRands(surplusCents)} left after your known bills.`
              : 'Your known bills currently use up your income — Atlas will help you find room as you log spending.'
          }
          delay={0.1}
        />
      )}

      {goal && (
        <Stat
          label={`Goal: ${goal.name}`}
          value={`${formatRands(goal.target_cents - goal.saved_cents)} to go`}
          detail={goalDetail ?? 'Add a monthly contribution or target date anytime to see a payoff timeline.'}
          delay={0.15}
        />
      )}

      <Button onClick={onNext} style={{ width: '100%', marginTop: '0.5rem' }}>Continue</Button>
    </div>
  );
}
