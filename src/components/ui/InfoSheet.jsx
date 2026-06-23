import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { C, F } from '../../tokens.js';

// Bottom-sheet explainer, same shell as ProPlansModal — render
// `{open && <InfoSheet ...>}` inside an AnimatePresence for an exit transition.
export function InfoSheet({ icon: Icon, title, children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(43, 42, 38, 0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          background: C.cream,
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem 1.25rem 2rem',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: C.slate }}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {Icon && (
            <span
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '3rem', height: '3rem', borderRadius: '50%', background: C.paper,
                margin: '0 auto 0.75rem', border: `1px solid ${C.line}`,
              }}
            >
              <Icon size={22} strokeWidth={2} color={C.sageDeep} />
            </span>
          )}
          <h3 style={{ fontFamily: F.serif, fontSize: '1.2rem', color: C.ink }}>{title}</h3>
        </div>

        <div style={{ color: C.slate, fontSize: '0.9rem', lineHeight: 1.6 }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}
