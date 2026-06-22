import { C, F } from '../../tokens.js';
import { formatWholeRands } from '../../lib/money.js';

// Value is tracked as a raw digit string representing cents (e.g. "12550" -> R125.50),
// matching how a calculator-style amount entry naturally builds up.
export function AmountInput({ digits, onDigit, onBackspace }) {
  const cents = Number(digits || '0');
  const rands = Math.floor(cents / 100);
  const centsPart = (cents % 100).toString().padStart(2, '0');

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: F.serif,
          fontSize: '3rem',
          color: C.ink,
          marginBottom: '1.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        R{formatWholeRands(rands)}.{centsPart}
      </div>
      <Keypad onDigit={onDigit} onBackspace={onBackspace} />
    </div>
  );
}

function Keypad({ onDigit, onBackspace }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', maxWidth: '280px', margin: '0 auto' }}>
      {keys.map((key, i) => {
        if (key === '') return <div key={i} />;
        const isBackspace = key === '⌫';
        return (
          <button
            key={i}
            type="button"
            onClick={() => (isBackspace ? onBackspace() : onDigit(key))}
            style={{
              fontFamily: F.sans,
              fontSize: '1.25rem',
              padding: '0.9rem 0',
              borderRadius: '10px',
              border: `1px solid ${C.line}`,
              background: C.paper,
              color: C.ink,
            }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
