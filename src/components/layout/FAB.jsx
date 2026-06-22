import { C } from '../../tokens.js';

export function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Log a financial event"
      style={{
        position: 'fixed',
        right: '1.25rem',
        bottom: '5rem',
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '50%',
        background: C.sage,
        color: C.paper,
        border: 'none',
        fontSize: '1.75rem',
        lineHeight: 1,
        boxShadow: '0 4px 14px rgba(43, 42, 38, 0.18)',
        zIndex: 20,
      }}
    >
      +
    </button>
  );
}
