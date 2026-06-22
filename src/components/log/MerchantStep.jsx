import { C, F } from '../../tokens.js';

export function MerchantStep({ merchant, onChange, suggestedCategory }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Merchant</span>
        <input
          autoFocus
          value={merchant}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Where did you spend it?"
          style={{
            width: '100%',
            fontFamily: F.serif,
            fontSize: '1.4rem',
            padding: '0.75rem 0.2rem',
            border: 'none',
            borderBottom: `2px solid ${C.line}`,
            background: 'transparent',
            color: C.ink,
            outline: 'none',
          }}
        />
      </label>
      {merchant && (
        <p style={{ color: C.slate, fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Category: <strong style={{ color: C.sageDeep, textTransform: 'capitalize' }}>{suggestedCategory.replace('_', ' ')}</strong>
        </p>
      )}
    </div>
  );
}
