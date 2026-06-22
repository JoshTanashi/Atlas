import { C, F } from '../../tokens.js';
import { navigate, useRoute } from '../../lib/nav.js';

const TABS = [
  { path: '/', label: 'Dashboard' },
  { path: '/timeline', label: 'Timeline' },
  { path: '/search', label: 'Search' },
  { path: '/goals', label: 'Goals' },
  { path: '/insights', label: 'Insights' },
  { path: '/me', label: 'Me' },
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
        padding: '0.6rem 0.25rem',
        position: 'sticky',
        bottom: 0,
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: F.sans,
              fontSize: '0.75rem',
              fontWeight: active ? 600 : 400,
              color: active ? C.sageDeep : C.slate,
              padding: '0.25rem 0.5rem',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
