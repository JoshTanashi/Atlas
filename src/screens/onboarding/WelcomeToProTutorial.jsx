import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, TrendingUp, PieChart, ChevronRight, Check } from 'lucide-react';
import { C, F } from '../../tokens.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';

const SLIDES = [
  { icon: Sparkles, label: 'AI insights', text: 'A short, honest read on your recent spending, generated on demand.' },
  { icon: TrendingUp, label: 'Next-month forecast', text: 'See where your spending is headed before the month is over.' },
  { icon: PieChart, label: 'Category breakdown', text: 'A clear picture of where your money actually goes, category by category.' },
];

// Full-screen, one-time celebration shown right after a checkout-success
// redirect confirms `profile.is_pro` flipped true — not a dismissible modal,
// since the upgrade has already happened by the time this renders.
export function WelcomeToProTutorial({ onFinish }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  const { icon: Icon, label, text } = SLIDES[slide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: C.cream, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '3rem', height: '3rem', borderRadius: '50%', background: C.paper,
              margin: '0 auto 0.75rem', border: `1px solid ${C.line}`,
            }}
          >
            <Crown size={22} strokeWidth={2} color={C.clay} />
          </span>
          <h1 style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink, marginBottom: '0.4rem' }}>Welcome to Pro</h1>
          <p style={{ color: C.slate, fontSize: '0.9rem' }}>Here's what just unlocked.</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <Card style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem 1.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: C.cream, marginBottom: '1rem' }}>
                <Icon size={26} strokeWidth={2} color={C.sageDeep} />
              </span>
              <p style={{ fontFamily: F.serif, fontSize: '1.2rem', color: C.ink, marginBottom: '0.5rem' }}>{label}</p>
              <p style={{ color: C.slate, fontSize: '0.88rem', lineHeight: 1.5 }}>{text}</p>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: i === slide ? C.sageDeep : C.line }} />
          ))}
        </div>

        <Button
          onClick={() => (isLast ? onFinish() : setSlide((s) => s + 1))}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
        >
          {isLast ? <>Start exploring <Check size={16} strokeWidth={2.5} /></> : <>Next <ChevronRight size={16} strokeWidth={2.5} /></>}
        </Button>
      </div>
    </motion.div>
  );
}
