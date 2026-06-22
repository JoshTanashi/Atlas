import { C } from '../../tokens.js';

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: '12px',
        padding: '1.25rem',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
