import { motion } from 'framer-motion';
import { C } from '../../tokens.js';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

// Wraps a `SettingsRow` group in a single flat container — one border, no per-row
// shadow — so a screen full of these reads as a grouped list rather than a stack
// of separately-boxed cards.
export function SettingsGroup({ label, children, style }) {
  return (
    <motion.div variants={item} style={{ marginBottom: '1.5rem', ...style }}>
      {label && <p className="label" style={{ marginBottom: '0.6rem' }}>{label}</p>}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '14px', overflow: 'hidden' }}>
        {children}
      </div>
    </motion.div>
  );
}

// Wrap the screen's top-level list of SettingsGroups in this to stagger them in on mount.
export function SettingsGroupList({ children }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}
