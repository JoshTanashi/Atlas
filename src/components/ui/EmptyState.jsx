import { motion } from 'framer-motion';
import { C, F } from '../../tokens.js';
import { Card } from './Card.jsx';

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <Card style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}>
      {Icon && (
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '3rem', height: '3rem', borderRadius: '50%', background: C.cream,
            marginBottom: '0.9rem',
          }}
        >
          <Icon size={20} strokeWidth={2} color={C.sageDeep} />
        </motion.span>
      )}
      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.25 }}
        style={{ fontFamily: F.serif, fontSize: '1.1rem', color: C.ink, marginBottom: '0.4rem' }}
      >
        {title}
      </motion.h3>
      {body && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.25 }}
          style={{ color: C.slate, fontSize: '0.95rem', marginBottom: action ? '1rem' : 0 }}
        >
          {body}
        </motion.p>
      )}
      {action}
    </Card>
  );
}
