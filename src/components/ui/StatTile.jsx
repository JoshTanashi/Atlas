import { C, F, SHADOW } from '../../tokens.js';

export function StatTile({ icon: Icon, label, value, valueColor, helper }) {
  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: '14px',
        padding: '1rem',
        boxShadow: SHADOW,
        flex: 1,
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          background: C.cream,
          marginBottom: '0.6rem',
        }}
      >
        <Icon size={16} strokeWidth={2} color={C.sageDeep} />
      </span>
      <p style={{ fontFamily: F.sans, fontSize: '0.75rem', color: C.slate }}>{label}</p>
      <p style={{ fontFamily: F.serif, fontSize: '1.25rem', color: valueColor ?? C.ink, marginTop: '0.15rem', whiteSpace: 'nowrap' }}>{value}</p>
      {helper && <p style={{ fontFamily: F.sans, fontSize: '0.72rem', color: C.slate, marginTop: '0.25rem' }}>{helper}</p>}
    </div>
  );
}
