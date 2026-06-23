import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, X } from 'lucide-react';
import { C, F } from '../../tokens.js';
import { Button } from '../ui/Button.jsx';
import { formatRands } from '../../lib/money.js';
import { navigate } from '../../lib/nav.js';
import { useProfile } from '../../hooks/useProfile.jsx';
import { supabase } from '../../lib/supabaseClient.js';

const PRO_FEATURES = [
  'AI-generated spending insights',
  'Next-month spend forecast',
  'Category breakdown of where money goes',
];

const MONTHLY_CENTS = 9900;
const YEARLY_CENTS = 99900;
const YEARLY_SAVINGS_CENTS = MONTHLY_CENTS * 12 - YEARLY_CENTS;

const TIERS = [
  { id: 'monthly', label: '1 Month', priceCents: MONTHLY_CENTS, periodLabel: '/month', badge: null },
  { id: 'yearly', label: '12 Months', priceCents: YEARLY_CENTS, periodLabel: '/year', badge: 'Best value' },
];

// Dedicated, in-depth Pro plans popup — rendered by the caller as
// `{open && <ProPlansModal onClose={...} session={session} profile={profile} />}`,
// optionally inside an AnimatePresence so the close gets an exit transition.
export function ProPlansModal({ onClose, session, profile }) {
  const { refresh: refreshProfile } = useProfile();
  const [plan, setPlan] = useState('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  async function handleUpgrade() {
    if (!session) {
      navigate('/sign-up');
      return;
    }
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { plan } });
      if (error) throw error;
      window.location.href = data.url;
    } catch (e) {
      setCheckoutError(e.message === 'OFFLINE' ? "You're offline — connect to upgrade." : 'Could not start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  }

  async function handleRefreshStatus() {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }

  const isPro = Boolean(profile?.is_pro);
  const planLabel = profile?.pro_plan ? `${profile.pro_plan[0].toUpperCase()}${profile.pro_plan.slice(1)}` : 'Pro';
  const renewal = profile?.pro_current_period_end
    ? new Date(profile.pro_current_period_end).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(43, 42, 38, 0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          background: C.cream,
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem 1.25rem 2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: C.slate }}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '3rem', height: '3rem', borderRadius: '50%', background: C.paper,
              margin: '0 auto 0.75rem', border: `1px solid ${C.line}`,
            }}
          >
            <Crown size={22} strokeWidth={2} color={C.clay} />
          </span>
          <h2 style={{ fontFamily: F.serif, fontSize: '1.4rem', color: C.ink, marginBottom: '0.4rem' }}>
            Unlock your full financial picture
          </h2>
          <p style={{ color: C.slate, fontSize: '0.9rem' }}>
            AI-read spending insights, a next-month forecast, and a category breakdown of where your money goes.
          </p>
        </div>

        {isPro ? (
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ color: C.ink, fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              You're on the {planLabel} plan{renewal ? ` — renews ${renewal}` : ''}
            </p>
            <FeatureList items={PRO_FEATURES} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {TIERS.map((tier) => {
                const active = plan === tier.id;
                const monthlyEquivalent = tier.id === 'yearly' ? YEARLY_CENTS / 12 : tier.priceCents;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setPlan(tier.id)}
                    style={{
                      position: 'relative',
                      textAlign: 'left',
                      padding: '0.9rem 1rem',
                      borderRadius: '14px',
                      border: `1.5px solid ${active ? C.sageDeep : C.line}`,
                      background: active ? C.paper : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {tier.badge && (
                      <span
                        style={{
                          position: 'absolute', top: '-0.55rem', right: '0.9rem',
                          background: C.clay, color: C.paper, fontSize: '0.7rem', fontWeight: 600,
                          padding: '0.15rem 0.55rem', borderRadius: '999px',
                        }}
                      >
                        {tier.badge}
                      </span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: C.ink, fontSize: '0.95rem', fontWeight: 500 }}>{tier.label}</span>
                      <span style={{ fontFamily: F.serif, fontSize: '1.1rem', color: C.ink }}>
                        {formatRands(monthlyEquivalent)}<span style={{ fontSize: '0.7rem', color: C.slate }}>/mo</span>
                      </span>
                    </div>
                    {tier.id === 'yearly' && (
                      <span style={{ color: C.sageDeep, fontSize: '0.78rem' }}>Save {formatRands(YEARLY_SAVINGS_CENTS)} a year</span>
                    )}
                  </button>
                );
              })}
            </div>

            <FeatureList items={PRO_FEATURES} />

            <Button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                background: 'linear-gradient(135deg, #C58A3D, #A8534A)',
                border: 'none',
              }}
            >
              {!session ? 'Create an account to go Pro' : checkoutLoading ? 'Redirecting…' : 'Continue'}
            </Button>
            {checkoutError && <p style={{ color: C.over, fontSize: '0.8rem', marginTop: '0.6rem', textAlign: 'center' }}>{checkoutError}</p>}

            <p style={{ color: C.slate, fontSize: '0.75rem', textAlign: 'center', marginTop: '0.9rem' }}>
              Cancel anytime — no commitment.
            </p>
          </>
        )}

        {session && (
          <button
            onClick={handleRefreshStatus}
            disabled={refreshing}
            style={{ display: 'block', margin: '0.9rem auto 0', background: 'none', border: 'none', color: C.slate, fontSize: '0.8rem', textDecoration: 'underline' }}
          >
            {refreshing ? 'Checking…' : 'Already subscribed? Refresh status'}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

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
