import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';

// Shared icon-card slide sequence with dot indicators, used by any onboarding
// step that walks through several short concepts one at a time (intro benefits,
// closing tutorial).
export function SlideCarousel({ slides, onFinish, finishLabel = 'Continue' }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === slides.length - 1;
  const { icon: Icon, label, text } = slides[slide];

  return (
    <div>
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
        {slides.map((_, i) => (
          <span key={i} style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: i === slide ? C.sageDeep : C.line }} />
        ))}
      </div>

      <Button
        onClick={() => (isLast ? onFinish() : setSlide((s) => s + 1))}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
      >
        {isLast ? <>{finishLabel} <Check size={16} strokeWidth={2.5} /></> : <>Next <ChevronRight size={16} strokeWidth={2.5} /></>}
      </Button>
    </div>
  );
}
