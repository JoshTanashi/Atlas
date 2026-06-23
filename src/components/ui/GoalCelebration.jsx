import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { C, F } from '../../tokens.js';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';

// A handful of sparks flung outward at fixed angles on mount — a confetti-lite
// burst that doesn't need a canvas or a particle library, just CSS positioning.
const SPARK_ANGLES = [-60, -30, 0, 30, 60, 200, 230, 260];

export function GoalCelebration({ goalName, onDismiss }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(43, 42, 38, 0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1.5rem',
        }}
        onClick={onDismiss}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{ position: 'relative', maxWidth: '320px', width: '100%' }}
        >
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {SPARK_ANGLES.map((angle, i) => (
              <motion.span
                key={angle}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 90,
                  y: Math.sin((angle * Math.PI) / 180) * 90,
                  opacity: 0,
                  scale: 0.4,
                }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.02, ease: 'easeOut' }}
                style={{
                  position: 'absolute', width: '8px', height: '8px', borderRadius: '50%',
                  background: i % 2 === 0 ? C.sage : C.clay,
                }}
              />
            ))}
          </div>

          <Card style={{ textAlign: 'center', position: 'relative' }}>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: C.cream, marginBottom: '0.9rem',
              }}
            >
              <PartyPopper size={26} strokeWidth={2} color={C.sageDeep} />
            </motion.span>
            <h2 style={{ fontFamily: F.serif, fontSize: '1.3rem', color: C.ink, marginBottom: '0.4rem' }}>Goal reached!</h2>
            <p style={{ color: C.slate, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              You've fully funded {goalName}. Nice work.
            </p>
            <Button onClick={onDismiss} style={{ width: '100%' }}>Nice!</Button>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
