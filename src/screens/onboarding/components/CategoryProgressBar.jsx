import { Wallet, Repeat, Landmark, Target } from 'lucide-react';
import { C, F } from '../../../tokens.js';

const CATEGORY_META = {
  income: { label: 'Income', icon: Wallet },
  recurring: { label: 'Recurring', icon: Repeat },
  'accounts-debts': { label: 'Accounts & Debts', icon: Landmark },
  goals: { label: 'Goals', icon: Target },
};

export function CategoryProgressBar({ steps, currentIndex }) {
  const order = [];
  const byCategory = {};
  steps.forEach((s, idx) => {
    if (!s.category) return;
    if (!byCategory[s.category]) {
      byCategory[s.category] = [];
      order.push(s.category);
    }
    byCategory[s.category].push(idx);
  });
  const currentCategory = steps[currentIndex]?.category;
  if (!currentCategory) return null;

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem 1.25rem 0', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {order.map((catKey) => {
        const { label, icon: Icon } = CATEGORY_META[catKey];
        const indices = byCategory[catKey];
        const isActive = catKey === currentCategory;
        return (
          <div key={catKey} style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.4rem' }}>
              {indices.map((idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    background: idx <= currentIndex ? C.sageDeep : C.line,
                    opacity: idx <= currentIndex ? 1 : 0.5,
                    transition: 'background 0.2s ease, opacity 0.2s ease',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Icon size={11} strokeWidth={2} color={isActive ? C.sageDeep : C.slate} />
              <span style={{ fontFamily: F.sans, fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: isActive ? C.sageDeep : C.slate }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
