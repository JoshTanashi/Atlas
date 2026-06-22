import { C, F } from '../../tokens.js';

export function Input({ label, type = 'text', value, onChange, placeholder, autoFocus, required, name }) {
  return (
    <label style={{ display: 'block', marginBottom: '1rem' }}>
      {label && <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>{label}</span>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        style={{
          width: '100%',
          fontFamily: F.sans,
          fontSize: '1rem',
          padding: '0.75rem 0.9rem',
          borderRadius: '10px',
          border: `1px solid ${C.line}`,
          background: C.paper,
          color: C.ink,
          outline: 'none',
        }}
      />
    </label>
  );
}
