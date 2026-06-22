import { useEffect, useState } from 'react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatRands } from '../lib/money.js';
import { useEvents } from '../hooks/useEvents.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import { trailingMonthlyExpenseTotals } from '../lib/aggregates.js';
import { forecastNextMonthCents } from '../lib/formulas.js';
import { supabase } from '../lib/supabaseClient.js';
import { replaceRoute } from '../lib/nav.js';

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
        <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', marginBottom: '1.25rem' }}>Insights</h1>
        {confirmingCheckout && (
          <Card style={{ marginBottom: '1rem' }}>
            <p style={{ color: C.slate, fontSize: '0.9rem' }}>Confirming your subscription…</p>
          </Card>
        )}
        <EmptyState
          title="Unlock AI insights & forecasting"
          body="Atlas Pro reads your journal and gives you a short, honest read on your spending, plus a simple forecast of next month based on your recent trend."
          action={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button onClick={() => handleUpgrade('monthly')} disabled={checkoutLoading !== null}>
                {checkoutLoading === 'monthly' ? 'Redirecting…' : 'Go Pro — R99/month'}
              </Button>
              <Button variant="secondary" onClick={() => handleUpgrade('yearly')} disabled={checkoutLoading !== null}>
                {checkoutLoading === 'yearly' ? 'Redirecting…' : 'Go Pro — R999/year'}
              </Button>
            </div>
          }
        />
        {checkoutError && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.75rem' }}>{checkoutError}</p>}
      </div>
    );
  }

  const trailing = trailingMonthlyExpenseTotals(events);
  const hasTrend = trailing.some((v) => v > 0);
  const forecastCents = hasTrend ? forecastNextMonthCents(trailing) : null;

  return (
    <div>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', marginBottom: '1.25rem' }}>Insights</h1>

      <Card style={{ marginBottom: '1rem' }}>
        <span className="label">Next month's forecast</span>
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

      <Card>
        <span className="label">AI insight</span>
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
        <Button variant="secondary" onClick={handleGenerateInsight} disabled={insightLoading} style={{ width: '100%', marginTop: '0.75rem' }}>
          {insightLoading ? 'Thinking…' : insight ? 'Regenerate insight' : 'Generate insight'}
        </Button>
        {insightError && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.5rem' }}>{insightError}</p>}
      </Card>
    </div>
  );
}
