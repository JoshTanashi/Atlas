import { Input } from '../../../components/ui/Input.jsx';
import { StepHeading, StepFooter } from '../components/StepShell.jsx';

export function IncomeAmountStep({ value, onChange, onNext }) {
  return (
    <div>
      <StepHeading
        title="How much do you take home?"
        subtitle="This helps Atlas calculate your savings rate and forecast the rest of your month."
      />
      <Input
        label="Monthly income (after tax)"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 28000"
      />
      <StepFooter onSkip={onNext} onContinue={onNext} />
    </div>
  );
}
