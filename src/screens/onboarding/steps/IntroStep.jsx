import { Wallet, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { StepHeading } from '../components/StepShell.jsx';
import { SlideCarousel } from '../components/SlideCarousel.jsx';

const BENEFIT_SLIDES = [
  { icon: Wallet, label: 'Know where it goes', text: 'Log spending in seconds and see where your money actually goes, category by category.' },
  { icon: Target, label: 'Goals that build themselves', text: 'Set a savings goal and watch your progress build automatically as you log.' },
  { icon: Sparkles, label: 'AI insights, on demand', text: 'Pro unlocks a forecast of your month ahead and an honest read on your recent spending.' },
  { icon: ShieldCheck, label: 'Private by design', text: 'Your data is encrypted and yours to export any time — no ads, no selling your data.' },
];

export function IntroStep({ onNext }) {
  return (
    <div>
      <StepHeading
        title="Welcome to Atlas"
        subtitle="A calm, honest journal for your money. A few quick questions will help Atlas work for you from day one."
      />
      <SlideCarousel slides={BENEFIT_SLIDES} onFinish={onNext} finishLabel="Get started" />
    </div>
  );
}
