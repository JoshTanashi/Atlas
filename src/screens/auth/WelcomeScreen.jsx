import { motion } from 'framer-motion';
import { C, F } from '../../tokens.js';
import { Button } from '../../components/ui/Button.jsx';
import { navigate } from '../../lib/nav.js';
import { useAuth } from '../../hooks/useAuth.jsx';

// First-launch decision screen for unauthenticated, non-guest visitors — sits
// strictly before `/sign-in`, `/sign-up`, etc. become reachable, giving a clear
// fork instead of dropping straight into the sign-in form.
export function WelcomeScreen() {
  const { enterGuestMode } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream, padding: '1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}
      >
        <h1 style={{ fontFamily: F.serif, fontSize: '2.2rem', color: C.ink, marginBottom: '0.6rem' }}>Atlas</h1>
        <p style={{ color: C.slate, fontFamily: F.sans, fontSize: '0.95rem', marginBottom: '2.5rem' }}>
          A calm, honest journal for your money.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button onClick={() => navigate('/sign-in')} style={{ width: '100%' }}>
            Sign In
          </Button>
          <Button variant="secondary" onClick={enterGuestMode} style={{ width: '100%' }}>
            Get Started
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
