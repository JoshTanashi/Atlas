import { AnimatePresence, motion } from 'framer-motion';
import { C } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';

export function ExplanationReveal({ show, children }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden' }}
        >
          <Card style={{ marginBottom: '1.25rem', background: C.cream }}>
            <p style={{ color: C.ink, fontSize: '0.85rem', lineHeight: 1.5 }}>{children}</p>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
