import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { C, F } from '../../../tokens.js';

export function ChoiceCardGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              textAlign: 'left',
              padding: '1rem 1.1rem',
              borderRadius: '14px',
              border: `1.5px solid ${active ? C.sageDeep : C.line}`,
              background: active ? C.cream : C.paper,
              cursor: 'pointer',
            }}
          >
            <div>
              <p style={{ fontFamily: F.sans, fontSize: '0.95rem', fontWeight: 600, color: C.ink, marginBottom: opt.helper ? '0.2rem' : 0 }}>
                {opt.label}
              </p>
              {opt.helper && <p style={{ color: C.slate, fontSize: '0.8rem' }}>{opt.helper}</p>}
            </div>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '50%',
                border: `1.5px solid ${active ? C.sageDeep : C.line}`,
                background: active ? C.sageDeep : 'transparent',
                flexShrink: 0,
              }}
            >
              {active && <Check size={13} strokeWidth={3} color={C.paper} />}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
