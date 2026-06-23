import { StepHeading, StepFooter } from '../components/StepShell.jsx';
import { ChoiceCardGroup } from '../components/ChoiceCardStep.jsx';
import { ExplanationReveal } from '../components/QuestionExplanationStep.jsx';

const EXPLANATIONS = {
  fixed: 'Same paycheck every period — Atlas uses this number directly to calculate your savings rate and monthly forecast.',
  variable: "Your income changes month to month — Atlas will ask for a typical amount and adjust as you log what actually comes in.",
};

export function IncomeTypeStep({ value, onChange, onNext }) {
  return (
    <div>
      <StepHeading title="Your income" subtitle="Is your income fixed or variable?" />
      <ChoiceCardGroup
        options={[{ value: 'fixed', label: 'Fixed' }, { value: 'variable', label: 'Variable' }]}
        value={value}
        onChange={onChange}
      />
      <ExplanationReveal show={Boolean(value)}>{EXPLANATIONS[value]}</ExplanationReveal>
      <StepFooter onSkip={onNext} onContinue={onNext} />
    </div>
  );
}
