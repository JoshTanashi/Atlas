import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { C, F } from '../../tokens.js';
import { shouldShowWelcome, markWelcomeShown } from '../../lib/welcomeCooldown.js';

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Plays once per cooldown window (see welcomeCooldown.js) so it greets the user
// when they genuinely return to the app, not on every refresh/navigation.
export function WelcomeBanner({ name }) {
  // Decide once at mount (lazy initializer), not inside the effect — otherwise
  // React's dev-mode double-invoked effects call markWelcomeShown() on the first
  // pass, so the second pass's shouldShowWelcome() check sees it as already shown
  // and skips creating the dismiss timer, leaving the banner stuck visible.
  const [visible, setVisible] = useState(() => shouldShowWelcome());

  useEffect(() => {
    if (!visible) return;
    markWelcomeShown();
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            background: C.sage,
            borderRadius: '14px',
            padding: '0.9rem 1rem',
            marginBottom: '1rem',
          }}
        >
          <motion.span
            animate={{ rotate: [0, 15, -10, 15, 0] }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '2rem', height: '2rem', borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)', flexShrink: 0,
            }}
          >
            <Sparkles size={16} strokeWidth={2} color={C.paper} />
          </motion.span>
          <p style={{ flex: 1, fontFamily: F.serif, fontSize: '1rem', color: C.paper }}>
            {timeOfDayGreeting()}{name ? `, ${name}` : ''}.
          </p>
          <button
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: C.paper, opacity: 0.85, display: 'flex', flexShrink: 0 }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
