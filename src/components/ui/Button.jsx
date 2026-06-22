import { C, F } from '../../tokens.js';

const variants = {
  primary: { background: C.sage, color: C.paper, border: 'none' },
  secondary: { background: 'transparent', color: C.ink, border: `1px solid ${C.line}` },
  ghost: { background: 'transparent', color: C.slate, border: 'none' },
};

export function Button({ children, variant = 'primary', disabled, onClick, type = 'button', style }) {
  const v = variants[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: F.sans,
        fontSize: '1rem',
        fontWeight: 500,
        padding: '0.85rem 1.25rem',
        borderRadius: '10px',
        background: v.background,
        color: v.color,
        border: v.border,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
