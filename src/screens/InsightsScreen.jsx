import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PieChart as RPieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, Sparkles, Crown, PieChart, Target, Banknote, PiggyBank, CreditCard } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { CategoryIcon } from '../components/ui/CategoryIcon.jsx';
import { StatTile } from '../components/ui/StatTile.jsx';
import { ProPlansModal } from '../components/pro/ProPlansModal.jsx';
import { WelcomeToProTutorial } from './onboarding/WelcomeToProTutorial.jsx';
import { formatRands } from '../lib/money.js';
import { useEvents } from '../hooks/useEvents.jsx';
import { useBaseline } from '../hooks/useBaseline.js';
import { useProfile } from '../hooks/useProfile.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useRecurringExpenses } from '../hooks/useRecurringExpenses.js';
import { trailingVariableExpenseTotals, categoryBreakdown, monthTotals, extrapolateMonthCents } from '../lib/aggregates.js';
import { forecastNextMonth } from '../lib/formulas.js';
import { supabase } from '../lib/supabaseClient.js';
import { replaceRoute } from '../lib/nav.js';

const SAMPLE_BREAKDOWN = [
  { category: 'groceries', cents: 320000 },
  { category: 'transport', cents: 180000 },
  { category: 'takeaways', cents: 95000 },
  { category: 'subscriptions', cents: 42000 },
];

const CHART_COLORS = ['#5B7B6F', '#B0734A', '#C58A3D', '#A8534A', '#3E5950', '#8C9A8A'];

export function InsightsScreen() {
  const { session } = useAuth();
  const { events, loading: eventsLoading } = useEvents();
  const { income, budget, debts, loading: baselineLoading } = useBaseline();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const { recurringExpenses, loading: recurringLoading } = useRecurringExpenses();

  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const [awaitingUpgrade, setAwaitingUpgrade] = useState(false);
  const [showProTutorial, setShowProTutorial] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);

  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(null);

  // Stripe redirects back here with ?checkout=success; the webhook can land a beat after the
  // redirect, so poll the profile a few times rather than showing a false "still locked" state.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;
    replaceRoute('/insights');
    setConfirmingCheckout(true);
    setAwaitingUpgrade(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      await refreshProfile();
      if (attempts >= 5) clearInterval(interval);
    }, 1500);
    return () => clearInterval(interval);
  }, [refreshProfile]);

  useEffect(() => {
    if (!profile?.is_pro) return;
    setConfirmingCheckout(false);
    if (awaitingUpgrade) {
      setAwaitingUpgrade(false);
      setShowProTutorial(true);
    }
  }, [profile?.is_pro, awaitingUpgrade]);

  useEffect(() => {
    if (!profile?.is_pro) return;
    supabase
      .from('ai_insights')
      .select('content, generated_at')
      .maybeSingle()
      .then(({ data }) => { if (data) setInsight(data); });
  }, [profile?.is_pro]);

  async function handleGenerateInsight() {
    setInsightError(null);
    setInsightLoading(true);
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { data, error } = await supabase.functions.invoke('generate-insight');
      if (error) throw error;
      setInsight({ content: data.content, generated_at: new Date().toISOString() });
    } catch (e) {
      setInsightError(e.message === 'OFFLINE' ? "You're offline — connect to generate an insight." : 'Could not generate an insight right now. Please try again.');
    } finally {
      setInsightLoading(false);
    }
  }

  if (eventsLoading || profileLoading || baselineLoading || recurringLoading) return <p style={{ color: C.slate }}>Loading…</p>;

  const { expenseCents, incomeCents } = monthTotals(events);

  if (!profile?.is_pro) {
    return (
      <div>
        <ScreenHeader title="Insights" />
        {confirmingCheckout && (
          <Card style={{ marginBottom: '1rem' }}>
            <p style={{ color: C.slate, fontSize: '0.9rem' }}>Confirming your subscription…</p>
          </Card>
        )}
        <OverviewCard budget={budget} income={income} debts={debts} expenseCents={expenseCents} incomeCents={incomeCents} />
        <div style={{ height: '1rem' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ filter: 'blur(5px)', opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
            <ForecastCard forecast={{ expectedCents: 148000, lowCents: 148000, highCents: 148000 }} />
            <div style={{ height: '1rem' }} />
            <CategoryBreakdownCard breakdown={SAMPLE_BREAKDOWN} />
            <div style={{ height: '1rem' }} />
            <AiInsightCard insight={{ content: 'Your takeaway spend is up 18% this month, mostly on weekday lunches. Shifting two of those to home-prepped meals would free up roughly R350.', generated_at: new Date().toISOString() }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <Card style={{ maxWidth: '300px', textAlign: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: C.cream, margin: '0 auto 0.6rem' }}>
                <Crown size={20} strokeWidth={2} color={C.clay} />
              </span>
              <h3 style={{ fontFamily: F.serif, fontSize: '1.15rem', color: C.ink, marginBottom: '0.4rem' }}>Atlas Pro</h3>
              <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '1rem' }}>
                AI-read spending insights, a next-month forecast, and a category breakdown of where your money goes.
              </p>
              <Button onClick={() => setProModalOpen(true)} style={{ width: '100%' }}>See Pro plans</Button>
            </Card>
          </div>
        </div>
        <AnimatePresence>
          {proModalOpen && (
            <ProPlansModal onClose={() => setProModalOpen(false)} session={session} profile={profile} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const recurringTotalCents = recurringExpenses.reduce((sum, r) => sum + r.amount_cents, 0);
  const variableTrailing = trailingVariableExpenseTotals(events, recurringExpenses);
  const hasTrend = variableTrailing.some((v) => v > 0);

  // With no prior months yet, project a day-one estimate from this month's spend so far
  // rather than waiting for a few months of trend data — the trend math (which separately
  // forecasts the unpredictable variable portion, then adds back known recurring bills)
  // takes over the moment hasTrend flips true.
  let forecast = null;
  let forecastEstimated = false;
  if (hasTrend) {
    const variableForecast = forecastNextMonth(variableTrailing);
    forecast = {
      expectedCents: variableForecast.expectedCents + recurringTotalCents,
      lowCents: variableForecast.lowCents + recurringTotalCents,
      highCents: variableForecast.highCents + recurringTotalCents,
    };
  } else if (expenseCents > 0) {
    const expected = extrapolateMonthCents(expenseCents);
    forecast = { expectedCents: expected, lowCents: expected, highCents: expected };
    forecastEstimated = true;
  }

  const breakdown = categoryBreakdown(events);

  return (
    <div>
      <ScreenHeader title="Insights" />
      <OverviewCard budget={budget} income={income} debts={debts} expenseCents={expenseCents} incomeCents={incomeCents} />
      <div style={{ height: '1rem' }} />
      <ForecastCard forecast={forecast} estimated={forecastEstimated} />
      <div style={{ height: '1rem' }} />
      <CategoryBreakdownCard breakdown={breakdown} />
      <div style={{ height: '1rem' }} />
      <AiInsightCard insight={insight} loading={insightLoading} error={insightError} onGenerate={handleGenerateInsight} />
      {showProTutorial && <WelcomeToProTutorial onFinish={() => setShowProTutorial(false)} />}
    </div>
  );
}

function OverviewCard({ budget, income, debts, expenseCents, incomeCents }) {
  const hasBudget = Boolean(budget?.monthly_budget_cents);
  const effectiveIncomeCents = income?.monthly_income_cents ?? incomeCents;
  const savingsCents = effectiveIncomeCents - expenseCents;
  const debtCents = debts.reduce((sum, d) => sum + d.balance_cents, 0);
  const budgetPct = hasBudget ? Math.min(1, expenseCents / budget.monthly_budget_cents) : null;

  return (
    <>
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream }}>
            <Target size={16} strokeWidth={2} color={C.sageDeep} />
          </span>
          <span className="label">Monthly budget</span>
        </div>
        {hasBudget ? (
          <>
            <p style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink }}>
              {formatRands(expenseCents)} <span style={{ fontSize: '1rem', color: C.slate, fontFamily: F.sans }}>of {formatRands(budget.monthly_budget_cents)}</span>
            </p>
            <div style={{ height: '8px', background: C.line, borderRadius: '4px', overflow: 'hidden', marginTop: '0.6rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${budgetPct * 100}%`,
                  background: budgetPct >= 1 ? C.over : C.sage,
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
            <p style={{ color: C.slate, fontSize: '0.8rem', marginTop: '0.4rem' }}>
              {(budgetPct * 100).toFixed(0)}% of budget spent this month.
            </p>
          </>
        ) : (
          <p style={{ color: C.slate, fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Set a monthly budget in Settings to track your spending against a cap.
          </p>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <StatTile icon={Banknote} label="Income" value={formatRands(effectiveIncomeCents)} helper="This month" />
        <StatTile icon={CreditCard} label="Expenses" value={formatRands(expenseCents)} helper="This month" />
        <StatTile
          icon={PiggyBank}
          label="Savings"
          value={formatRands(savingsCents)}
          valueColor={savingsCents < 0 ? C.over : C.sageDeep}
          helper="Income minus expenses"
        />
        <StatTile icon={CreditCard} label="Total debt" value={formatRands(debtCents)} helper={`${debts.length} debt${debts.length === 1 ? '' : 's'}`} />
      </div>
    </>
  );
}

function ForecastCard({ forecast, estimated }) {
  const showBand = forecast && !estimated && forecast.highCents > forecast.lowCents;

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream }}>
          <TrendingUp size={16} strokeWidth={2} color={C.sageDeep} />
        </span>
        <span className="label">Next month's forecast</span>
      </div>
      {forecast !== null ? (
        <>
          <p style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink }}>{formatRands(Math.max(0, forecast.expectedCents))}</p>
          <p style={{ color: C.slate, fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {estimated
              ? "Early estimate, projected from this month's spending so far."
              : showBand
                ? `Likely between ${formatRands(Math.max(0, forecast.lowCents))} and ${formatRands(forecast.highCents)}, based on your recent trend plus known recurring bills.`
                : 'Based on your spending trend plus known recurring bills.'}
          </p>
        </>
      ) : (
        <p style={{ color: C.slate, fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Log an expense to see an early forecast.
        </p>
      )}
    </Card>
  );
}

function CategoryBreakdownCard({ breakdown }) {
  const total = breakdown.reduce((sum, b) => sum + b.cents, 0);

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream }}>
          <PieChart size={16} strokeWidth={2} color={C.sageDeep} />
        </span>
        <span className="label">Spending by category</span>
      </div>
      {total === 0 ? (
        <p style={{ color: C.slate, fontSize: '0.9rem' }}>No expenses logged this month yet.</p>
      ) : (
        <>
          <div style={{ width: '100%', height: 200, marginBottom: '0.6rem' }}>
            <RPieChart width={260} height={200} style={{ margin: '0 auto', display: 'block' }}>
              <Pie data={breakdown} dataKey="cents" nameKey="category" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {breakdown.map((entry, i) => (
                  <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(cents) => formatRands(cents)} />
            </RPieChart>
          </div>
          {breakdown.map(({ category, cents }) => (
            <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <CategoryIcon category={category} direction="expense" size={14} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: C.ink, fontSize: '0.85rem', textTransform: 'capitalize' }}>{category.replace('_', ' ')}</span>
                  <span style={{ color: C.slate, fontSize: '0.85rem' }}>{formatRands(cents)}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '4px', background: C.cream, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(4, (cents / total) * 100)}%`, background: C.sage, borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}

function AiInsightCard({ insight, loading, error, onGenerate }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream }}>
          <Sparkles size={16} strokeWidth={2} color={C.sageDeep} />
        </span>
        <span className="label">AI insight</span>
      </div>
      {insight ? (
        <>
          <p style={{ color: C.ink, fontSize: '0.95rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{insight.content}</p>
          <p style={{ color: C.slate, fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Generated {new Date(insight.generated_at).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric' })}
          </p>
        </>
      ) : (
        <p style={{ color: C.slate, fontSize: '0.9rem', margin: '0.4rem 0' }}>
          Generate a short, honest read on your recent spending.
        </p>
      )}
      {onGenerate && (
        <Button variant="secondary" onClick={onGenerate} disabled={loading} style={{ width: '100%', marginTop: '0.75rem' }}>
          {loading ? 'Thinking…' : insight ? 'Regenerate insight' : 'Generate insight'}
        </Button>
      )}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
    </Card>
  );
}
