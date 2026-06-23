import { useEffect, useState } from 'react';
import { Percent, Wallet, Hourglass, PieChart as PieIcon, Sparkles, Crown } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { StatTile } from '../components/ui/StatTile.jsx';
import { CategoryIcon } from '../components/ui/CategoryIcon.jsx';
import { formatRands } from '../lib/money.js';
import { navigate } from '../lib/nav.js';
import { useEvents } from '../hooks/useEvents.jsx';
import { useBaseline } from '../hooks/useBaseline.js';
import { useProfile } from '../hooks/useProfile.jsx';
import { monthTotals, trailingMonthlyExpenseAverage, categoryBreakdown } from '../lib/aggregates.js';
import { savingsRate, netWorth, runwayMonths } from '../lib/formulas.js';
import { supabase } from '../lib/supabaseClient.js';

const SAMPLE_BREAKDOWN = [
  { category: 'groceries', cents: 320000 },
  { category: 'transport', cents: 180000 },
  { category: 'takeaways', cents: 95000 },
];

export function DashboardScreen() {
  const { events, loading: eventsLoading } = useEvents();
  const { income, accounts, debts, loading: baselineLoading } = useBaseline();
  const { profile, loading: profileLoading } = useProfile();
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    if (!profile?.is_pro) return;
    supabase
      .from('ai_insights')
      .select('content, generated_at')
      .maybeSingle()
      .then(({ data }) => { if (data) setInsight(data); });
  }, [profile?.is_pro]);

  if (eventsLoading || baselineLoading || profileLoading) return <p style={{ color: C.slate }}>Loading…</p>;

  const { expenseCents, incomeCents } = monthTotals(events);
  const hasIncome = Boolean(income?.monthly_income_cents);
  const hasAccounts = accounts.length > 0;
  const rate = hasIncome ? savingsRate(income.monthly_income_cents, expenseCents) : null;
  const worth = hasAccounts ? netWorth(accounts, debts) : null;
  const spendOfIncomePct = hasIncome ? Math.min(1, expenseCents / income.monthly_income_cents) : null;

  let runway = null;
  if (hasAccounts) {
    const liquid = accounts
      .filter((a) => a.kind === 'checking' || a.kind === 'savings')
      .reduce((sum, a) => sum + a.balance_cents, 0);
    const { average, estimated } = trailingMonthlyExpenseAverage(events);
    const months = runwayMonths(liquid, average);
    runway = months === null ? null : { months, estimated };
  }

  return (
    <div>
      <ScreenHeader title="This Month" showSearch />

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Spent</span>
        <p style={{ fontFamily: F.serif, fontSize: '2rem', color: C.ink, marginTop: '0.2rem' }}>{formatRands(expenseCents)}</p>
        {hasIncome ? (
          <>
            <div style={{ height: '8px', background: C.line, borderRadius: '4px', overflow: 'hidden', marginTop: '0.75rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${spendOfIncomePct * 100}%`,
                  background: spendOfIncomePct >= 1 ? C.over : C.sage,
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
            <p style={{ color: C.slate, fontSize: '0.8rem', marginTop: '0.4rem' }}>
              {(spendOfIncomePct * 100).toFixed(0)}% of your {formatRands(income.monthly_income_cents)} income so far this month.
            </p>
          </>
        ) : incomeCents > 0 ? (
          <p style={{ color: C.slate, fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Income logged: {formatRands(incomeCents)}
          </p>
        ) : null}
      </Card>

      {hasIncome || hasAccounts ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {hasIncome && (
            <StatTile
              icon={Percent}
              label="Savings rate"
              value={`${(rate * 100).toFixed(0)}%`}
              valueColor={rate < 0 ? C.over : C.sageDeep}
              helper={rate >= 0 ? `Keeping R${(rate * 100).toFixed(0)} of every R100 earned` : 'Spending more than you earn'}
            />
          )}
          {hasAccounts && (
            <StatTile
              icon={Wallet}
              label="Net worth"
              value={formatRands(worth)}
              helper={debts.length > 0 ? 'Balances minus debts' : 'Total across accounts'}
            />
          )}
          {runway && (
            <StatTile
              icon={Hourglass}
              label="Runway"
              value={`${runway.months.toFixed(1)} mo`}
              helper={runway.estimated ? 'Estimate — limited history' : 'At your current spend'}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title="Add your income and balances"
          body="Unlock your savings rate, net worth, and runway."
          action={<Button variant="secondary" onClick={() => navigate('/settings')}>Set up in Settings →</Button>}
        />
      )}

      <div style={{ marginTop: '1rem' }}>
        <Card>
          <span className="label">Recent activity</span>
          {events.length === 0 ? (
            <p style={{ color: C.slate, fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Log your first entry — tap the + button.
            </p>
          ) : (
            events.slice(0, 5).map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderTop: `1px solid ${C.line}` }}>
                <CategoryIcon category={e.category} direction={e.direction} />
                <span style={{ color: C.ink, flex: 1 }}>{e.merchant}</span>
                <span style={{ color: e.direction === 'income' ? C.sageDeep : C.ink, fontFamily: F.serif }}>
                  {e.direction === 'income' ? '+' : '-'}{formatRands(e.amount_cents)}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {profile?.is_pro ? (
          <>
            <MiniCategoryCard breakdown={categoryBreakdown(events).slice(0, 3)} />
            <div style={{ height: '1rem' }} />
            <MiniInsightCard insight={insight} />
          </>
        ) : (
          <ProTeaserCard />
        )}
      </div>
    </div>
  );
}

function MiniCategoryCard({ breakdown }) {
  const total = breakdown.reduce((sum, b) => sum + b.cents, 0);

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream }}>
          <PieIcon size={16} strokeWidth={2} color={C.sageDeep} />
        </span>
        <span className="label">Top categories</span>
      </div>
      {total === 0 ? (
        <p style={{ color: C.slate, fontSize: '0.9rem' }}>No expenses logged this month yet.</p>
      ) : (
        breakdown.map(({ category, cents }) => (
          <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <CategoryIcon category={category} direction="expense" size={14} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ color: C.ink, fontSize: '0.85rem', textTransform: 'capitalize' }}>{category.replace('_', ' ')}</span>
                <span style={{ color: C.slate, fontSize: '0.85rem' }}>{formatRands(cents)}</span>
              </div>
              <div style={{ height: '6px', borderRadius: '4px', background: C.cream, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(4, (cents / total) * 100)}%`, background: C.sage, borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        ))
      )}
      <Button variant="ghost" onClick={() => navigate('/insights')} style={{ padding: '0.4rem 0', fontSize: '0.85rem' }}>
        View full breakdown →
      </Button>
    </Card>
  );
}

function MiniInsightCard({ insight }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream }}>
          <Sparkles size={16} strokeWidth={2} color={C.sageDeep} />
        </span>
        <span className="label">AI insight</span>
      </div>
      {insight ? (
        <p style={{ color: C.ink, fontSize: '0.9rem', marginTop: '0.4rem' }}>
          {insight.content.length > 120 ? `${insight.content.slice(0, 120)}…` : insight.content}
        </p>
      ) : (
        <p style={{ color: C.slate, fontSize: '0.9rem', margin: '0.4rem 0' }}>
          Generate a short, honest read on your recent spending in Insights.
        </p>
      )}
      <Button variant="ghost" onClick={() => navigate('/insights')} style={{ padding: '0.4rem 0', fontSize: '0.85rem' }}>
        {insight ? 'View in Insights →' : 'Generate insight →'}
      </Button>
    </Card>
  );
}

function ProTeaserCard() {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(4px)', opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
        <MiniCategoryCard breakdown={SAMPLE_BREAKDOWN} />
      </div>
      <button
        onClick={() => navigate('/insights')}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: F.sans,
          fontSize: '0.9rem',
          fontWeight: 500,
          color: C.ink,
        }}
      >
        <Crown size={16} strokeWidth={2} color={C.clay} />
        Unlock category insights with Atlas Pro
      </button>
    </div>
  );
}
