import { Info } from 'lucide-react';
import { C, F, SHADOW } from '../../tokens.js';

export function StatTile({ icon: Icon, label, value, valueColor, helper, onInfoClick }) {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            background: C.cream,
          }}
        >
          <Icon size={16} strokeWidth={2} color={C.sageDeep} />
        </span>
        {onInfoClick && (
          <button
            onClick={onInfoClick}
            aria-label={`About ${label}`}
            style={{ background: 'none', border: 'none', color: C.slate, padding: 0, display: 'flex' }}
          >
            <Info size={14} strokeWidth={2} />
          </button>
        )}
      </div>
      <p style={{ fontFamily: F.sans, fontSize: '0.75rem', color: C.slate }}>{label}</p>
      <p style={{ fontFamily: F.serif, fontSize: '1.25rem', color: valueColor ?? C.ink, marginTop: '0.15rem', whiteSpace: 'nowrap' }}>{value}</p>
      {helper && <p style={{ fontFamily: F.sans, fontSize: '0.72rem', color: C.slate, marginTop: '0.25rem' }}>{helper}</p>}
    </div>
  );
}
