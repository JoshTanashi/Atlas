import { Home, Clock, Target, Sparkles, Settings } from 'lucide-react';
import { C, F } from '../../tokens.js';
import { navigate, useRoute } from '../../lib/nav.js';

const TABS = [
  { path: '/', label: 'Home', Icon: Home },
  { path: '/timeline', label: 'Timeline', Icon: Clock },
  { path: '/goals', label: 'Goals', Icon: Target },
  { path: '/insights', label: 'Insights', Icon: Sparkles },
  { path: '/settings', label: 'Settings', Icon: Settings },
];

export function BottomNav() {
  const pathname = useRoute();

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        background: C.paper,
        borderTop: `1px solid ${C.line}`,
        padding: '0.5rem 0.25rem',
        position: 'sticky',
        bottom: 0,
      }}
    >
      {TABS.map(({ path, label, Icon }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              background: 'none',
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: '14px',
              minWidth: '3.6rem',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '50%',
                background: active ? C.sage : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <Icon size={20} strokeWidth={2} color={active ? C.paper : C.slate} />
            </span>
            <span
              style={{
                fontFamily: F.sans,
                fontSize: '0.7rem',
                fontWeight: active ? 600 : 400,
                color: active ? C.sageDeep : C.slate,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
