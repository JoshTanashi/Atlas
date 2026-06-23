import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { C } from '../../tokens.js';

// A single flat row inside a SettingsGroup: icon + label/sublabel, then a
// right-aligned control (chevron / pill / value text). `children` renders an
// expand-in-place panel below the row (e.g. a form), toggled by the caller.
export function SettingsRow({ icon: Icon, label, sublabel, value, pill, chevron, danger, onClick, children }) {
  const interactive = !!onClick;
  return (
    <div className="settings-row">
      <motion.div
        className="settings-row-main"
        onClick={onClick}
        whileTap={interactive ? { scale: 0.99, backgroundColor: 'rgba(0,0,0,0.02)' } : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          cursor: interactive ? 'pointer' : 'default',
        }}
      >
        {Icon && (
          <span
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '1.8rem', height: '1.8rem', borderRadius: '50%',
              background: danger ? 'rgba(168, 83, 74, 0.1)' : C.cream, flexShrink: 0,
            }}
          >
            <Icon size={15} strokeWidth={2} color={danger ? C.over : C.sageDeep} />
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: danger ? C.over : C.ink, fontSize: '0.95rem', fontWeight: 500 }}>{label}</p>
          {sublabel && <p style={{ color: C.slate, fontSize: '0.78rem', marginTop: '0.1rem' }}>{sublabel}</p>}
        </div>
        {pill && (
          <span
            style={{
              background: C.sage, color: C.paper, fontSize: '0.75rem', fontWeight: 600,
              padding: '0.25rem 0.6rem', borderRadius: '999px', flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            {pill}
          </span>
        )}
        {value && <span style={{ color: C.slate, fontSize: '0.85rem', flexShrink: 0 }}>{value}</span>}
        {chevron && <ChevronRight size={18} strokeWidth={2} color={C.slate} style={{ flexShrink: 0 }} />}
      </motion.div>
      {children}
    </div>
  );
}

// Expand-in-place panel rendered as a SettingsRow's child — animated reveal of
// form content (e.g. the income input) directly below the row that opened it.
export function SettingsRowExpand({ children }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ overflow: 'hidden', borderTop: `1px solid ${C.line}`, padding: '0.9rem 1rem' }}
    >
      {children}
    </motion.div>
  );
}
