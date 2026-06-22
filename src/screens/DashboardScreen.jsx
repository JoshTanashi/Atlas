import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatRands } from '../lib/money.js';
import { navigate } from '../lib/nav.js';
import { useEvents } from '../hooks/useEvents.js';
import { useBaseline } from '../hooks/useBaseline.js';
import { monthTotals, trailingMonthlyExpenseAverage } from '../lib/aggregates.js';
import { savingsRate, netWorth, runwayMonths } from '../lib/formulas.js';

export function DashboardScreen() {
  const { events, loading: eventsLoading } = useEvents();
  const { income, accounts, debts, loading: baselineLoading } = useBaseline();

  if (eventsLoading || baselineLoading) return <p style={{ color: C.slate }}>Loading…</p>;

  const { expenseCents, incomeCents } = monthTotals(events);
  const hasIncome = Boolean(income?.monthly_income_cents);
  const hasAccounts = accounts.length > 0;
  const rate = hasIncome ? savingsRate(income.monthly_income_cents, expenseCents) : null;
  const worth = hasAccounts ? netWorth(accounts, debts) : null;

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
      <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', marginBottom: '1.25rem' }}>This Month</h1>

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Spent</span>
        <p style={{ fontFamily: F.serif, fontSize: '1.8rem', color: C.ink }}>{formatRands(expenseCents)}</p>
        {incomeCents > 0 && (
          <p style={{ color: C.slate, fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Income logged: {formatRands(incomeCents)}
          </p>
        )}
      </Card>

      {hasIncome ? (
        <Card style={{ marginBottom: '1rem' }}>
          <span className="label">Savings rate</span>
          <p style={{ fontFamily: F.serif, fontSize: '1.6rem', color: rate < 0 ? C.over : C.sageDeep }}>
            {(rate * 100).toFixed(1)}%
          </p>
          <p style={{ color: C.slate, fontSize: '0.85rem' }}>
            {rate >= 0 ? "You're saving" : "You've spent more than your income"} this month.
          </p>
        </Card>
      ) : (
        <EmptyState
          title="Add your income"
          body="See how much you're saving this month."
          action={<Button variant="secondary" onClick={() => navigate('/me')}>Add income →</Button>}
        />
      )}

      {hasAccounts ? (
        <Card style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <span className="label">Net worth</span>
          <p style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink }}>{formatRands(worth)}</p>
          {runway && (
            <p style={{ color: C.slate, fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Runway: {runway.months.toFixed(1)} months{runway.estimated ? ' (estimate, limited history)' : ''}
            </p>
          )}
        </Card>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <EmptyState
            title="Add your balances"
            body="See your net worth and emergency-fund runway."
            action={<Button variant="secondary" onClick={() => navigate('/me')}>Add balances →</Button>}
          />
        </div>
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
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: `1px solid ${C.line}` }}>
                <span style={{ color: C.ink }}>{e.merchant}</span>
                <span style={{ color: e.direction === 'income' ? C.sageDeep : C.ink, fontFamily: F.serif }}>
                  {e.direction === 'income' ? '+' : '-'}{formatRands(e.amount_cents)}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
