import { Home, Clock, Target, Sparkles, Settings } from 'lucide-react';
import { StepHeading } from '../components/StepShell.jsx';
import { SlideCarousel } from '../components/SlideCarousel.jsx';

const TUTORIAL_SLIDES = [
  { icon: Home, label: 'Home', text: 'Your dashboard — spending, income, and savings rate for the month, at a glance.' },
  { icon: Clock, label: 'Timeline', text: 'Every entry you log, in order, so you can always see and search where money went.' },
  { icon: Target, label: 'Goals', text: 'Set targets and watch your progress build automatically as you save.' },
  { icon: Sparkles, label: 'Insights', text: 'AI-generated insights and a forecast of your month ahead — a Pro feature.' },
  { icon: Settings, label: 'Settings', text: 'Your plan, accounts, debts, theme, and account security all live here.' },
];

export function TutorialStep({ onFinish }) {
  return (
    <div>
      <StepHeading title="A quick tour" subtitle="Here's what each part of Atlas does." />
      <SlideCarousel slides={TUTORIAL_SLIDES} onFinish={onFinish} finishLabel="Start using Atlas" />
    </div>
  );
}
