import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Clock, Target, Sparkles, Settings, ChevronRight, Check } from 'lucide-react';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { StepHeading } from '../components/StepShell.jsx';

const TUTORIAL_SLIDES = [
  { icon: Home, label: 'Home', text: 'Your dashboard — spending, income, and savings rate for the month, at a glance.' },
  { icon: Clock, label: 'Timeline', text: 'Every entry you log, in order, so you can always see and search where money went.' },
  { icon: Target, label: 'Goals', text: 'Set targets and watch your progress build automatically as you save.' },
  { icon: Sparkles, label: 'Insights', text: 'AI-generated insights and a forecast of your month ahead — a Pro feature.' },
  { icon: Settings, label: 'Settings', text: 'Your plan, accounts, debts, theme, and account security all live here.' },
];

export function TutorialStep({ onFinish }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === TUTORIAL_SLIDES.length - 1;
  const { icon: Icon, label, text } = TUTORIAL_SLIDES[slide];

  return (
    <div>
      <StepHeading title="A quick tour" subtitle="Here's what each part of Atlas does." />

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
        {TUTORIAL_SLIDES.map((_, i) => (
          <span key={i} style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: i === slide ? C.sageDeep : C.line }} />
        ))}
      </div>

      <Button
        onClick={() => (isLast ? onFinish() : setSlide((s) => s + 1))}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
      >
        {isLast ? <>Start using Atlas <Check size={16} strokeWidth={2.5} /></> : <>Next <ChevronRight size={16} strokeWidth={2.5} /></>}
      </Button>
    </div>
  );
}
