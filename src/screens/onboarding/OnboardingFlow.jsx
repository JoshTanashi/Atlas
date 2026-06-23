import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { C } from '../../tokens.js';
import { useProfile } from '../../hooks/useProfile.jsx';
import { navigate } from '../../lib/nav.js';
import { CategoryProgressBar } from './components/CategoryProgressBar.jsx';
import { IntroStep } from './steps/IntroStep.jsx';
import { IncomeTypeStep } from './steps/IncomeTypeStep.jsx';
import { IncomeAmountStep } from './steps/IncomeAmountStep.jsx';
import { IncomeFrequencyStep } from './steps/IncomeFrequencyStep.jsx';
import { ChartRecurringStep } from './steps/ChartRecurringStep.jsx';
import { RecurringStep } from './steps/RecurringStep.jsx';
import { AccountsStep } from './steps/AccountsStep.jsx';
import { DebtsStep } from './steps/DebtsStep.jsx';
import { ChartGoalsStep } from './steps/ChartGoalsStep.jsx';
import { GoalStep } from './steps/GoalStep.jsx';
import { PlanReadyStep } from './steps/PlanReadyStep.jsx';
import { TutorialStep } from './steps/TutorialStep.jsx';

const STEPS = [
  { key: 'intro', category: null },
  { key: 'income-type', category: 'income' },
  { key: 'income-amount', category: 'income' },
  { key: 'income-frequency', category: 'income' },
  { key: 'chart-recurring', category: null },
  { key: 'recurring', category: 'recurring' },
  { key: 'accounts', category: 'accounts-debts' },
  { key: 'debts', category: 'accounts-debts' },
  { key: 'chart-goals', category: null },
  { key: 'goal', category: 'goals' },
  { key: 'plan-ready', category: null },
  { key: 'tutorial', category: null },
];

export function OnboardingFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const { completeOnboarding } = useProfile();

  const [incomeType, setIncomeType] = useState('fixed');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');
  const [payDay, setPayDay] = useState('');

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function finish() {
    try {
      await completeOnboarding();
    } catch {
      // Onboarding still ends even if this fails to save — it'll just be asked again.
    }
    navigate('/');
  }

  const step = STEPS[stepIndex].key;

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column' }}>
      <CategoryProgressBar steps={STEPS} currentIndex={stepIndex} />
      <div style={{ flex: 1, padding: '1.5rem 1.25rem 2.5rem', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'intro' && <IntroStep onNext={next} />}
            {step === 'income-type' && <IncomeTypeStep value={incomeType} onChange={setIncomeType} onNext={next} />}
            {step === 'income-amount' && <IncomeAmountStep value={incomeAmount} onChange={setIncomeAmount} onNext={next} />}
            {step === 'income-frequency' && (
              <IncomeFrequencyStep
                incomeType={incomeType}
                amount={incomeAmount}
                value={incomeFrequency}
                onChange={setIncomeFrequency}
                payDay={payDay}
                onPayDayChange={setPayDay}
                onNext={next}
              />
            )}
            {step === 'chart-recurring' && <ChartRecurringStep onNext={next} />}
            {step === 'recurring' && <RecurringStep onNext={next} />}
            {step === 'accounts' && <AccountsStep onNext={next} />}
            {step === 'debts' && <DebtsStep onNext={next} />}
            {step === 'chart-goals' && <ChartGoalsStep onNext={next} />}
            {step === 'goal' && <GoalStep onNext={next} />}
            {step === 'plan-ready' && <PlanReadyStep onNext={next} />}
            {step === 'tutorial' && <TutorialStep onFinish={finish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
