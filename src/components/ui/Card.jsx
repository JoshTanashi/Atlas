import { C, SHADOW } from '../../tokens.js';

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: '14px',
        padding: '1.25rem',
        boxShadow: SHADOW,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
