import { useEffect, useState } from 'react';
import { TrendingUp, Sparkles, Crown, PieChart } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ScreenHeader } from '../components/ui/ScreenHeader.jsx';
import { CategoryIcon } from '../components/ui/CategoryIcon.jsx';
import { formatRands } from '../lib/money.js';
import { useEvents } from '../hooks/useEvents.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import { trailingMonthlyExpenseTotals, categoryBreakdown } from '../lib/aggregates.js';
import { forecastNextMonthCents } from '../lib/formulas.js';
import { supabase } from '../lib/supabaseClient.js';
import { replaceRoute } from '../lib/nav.js';

const SAMPLE_BREAKDOWN = [
  { category: 'groceries', cents: 320000 },
  { category: 'transport', cents: 180000 },
  { category: 'takeaways', cents: 95000 },
  { category: 'subscriptions', cents: 42000 },
];

export function InsightsScreen() {
  const { events, loading: eventsLoading } = useEvents();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();

  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // 'monthly' | 'yearly' | null
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);

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
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      await refreshProfile();
      if (attempts >= 5) clearInterval(interval);
    }, 1500);
    return () => clearInterval(interval);
  }, [refreshProfile]);

  useEffect(() => {
    if (profile?.is_pro) setConfirmingCheckout(false);
  }, [profile?.is_pro]);

  useEffect(() => {
    if (!profile?.is_pro) return;
    supabase
      .from('ai_insights')
      .select('content, generated_at')
      .maybeSingle()
      .then(({ data }) => { if (data) setInsight(data); });
  }, [profile?.is_pro]);

  async function handleUpgrade(plan) {
    setCheckoutError(null);
    setCheckoutLoading(plan);
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { plan } });
      if (error) throw error;
      window.location.href = data.url;
    } catch (e) {
      setCheckoutError(e.message === 'OFFLINE' ? "You're offline — connect to upgrade." : 'Could not start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  }

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

  if (eventsLoading || profileLoading) return <p style={{ color: C.slate }}>Loading…</p>;

  if (!profile?.is_pro) {
    return (
      <div>
        <ScreenHeader title="Insights" />
        {confirmingCheckout && (
          <Card style={{ marginBottom: '1rem' }}>
            <p style={{ color: C.slate, fontSize: '0.9rem' }}>Confirming your subscription…</p>
          </Card>
        )}
        <div style={{ position: 'relative' }}>
          <div style={{ filter: 'blur(5px)', opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
            <ForecastCard forecastCents={148000} />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button onClick={() => handleUpgrade('monthly')} disabled={checkoutLoading !== null}>
                  {checkoutLoading === 'monthly' ? 'Redirecting…' : 'Upgrade — R99/month'}
                </Button>
                <Button variant="secondary" onClick={() => handleUpgrade('yearly')} disabled={checkoutLoading !== null}>
                  {checkoutLoading === 'yearly' ? 'Redirecting…' : 'Upgrade — R999/year'}
                </Button>
              </div>
              {checkoutError && <p style={{ color: C.over, fontSize: '0.8rem', marginTop: '0.6rem' }}>{checkoutError}</p>}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const trailing = trailingMonthlyExpenseTotals(events);
  const hasTrend = trailing.some((v) => v > 0);
  const forecastCents = hasTrend ? forecastNextMonthCents(trailing) : null;
  const breakdown = categoryBreakdown(events);

  return (
    <div>
      <ScreenHeader title="Insights" />
      <ForecastCard forecastCents={forecastCents} />
      <div style={{ height: '1rem' }} />
      <CategoryBreakdownCard breakdown={breakdown} />
      <div style={{ height: '1rem' }} />
      <AiInsightCard insight={insight} loading={insightLoading} error={insightError} onGenerate={handleGenerateInsight} />
    </div>
  );
}

function ForecastCard({ forecastCents }) {
  return (
    <Card style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background: C.cream }}>
          <TrendingUp size={16} strokeWidth={2} color={C.sageDeep} />
        </span>
        <span className="label">Next month's forecast</span>
      </div>
      {forecastCents !== null ? (
        <>
          <p style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink }}>{formatRands(Math.max(0, forecastCents))}</p>
          <p style={{ color: C.slate, fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Based on your spending trend over the last 3 months.
          </p>
        </>
      ) : (
        <p style={{ color: C.slate, fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Not enough history yet — log a few more months to see a forecast.
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
        breakdown.map(({ category, cents }) => (
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
        ))
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
