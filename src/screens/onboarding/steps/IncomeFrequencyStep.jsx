import { useState } from 'react';
import { Input } from '../../../components/ui/Input.jsx';
import { useBaseline } from '../../../hooks/useBaseline.js';
import { randsToCents } from '../../../lib/money.js';
import { describeError } from '../shared.js';
import { StepHeading, StepFooter } from '../components/StepShell.jsx';
import { ChoiceCardGroup } from '../components/ChoiceCardStep.jsx';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'irregular', label: 'Irregular' },
];

export function IncomeFrequencyStep({ incomeType, amount, value, onChange, payDay, onPayDayChange, onNext }) {
  const { setMonthlyIncome } = useBaseline();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleContinue() {
    if (!amount) {
      onNext();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setMonthlyIncome(randsToCents(Number(amount)), {
        income_type: incomeType,
        pay_frequency: value,
        pay_day: value === 'irregular' || !payDay ? null : Number(payDay),
      });
      onNext();
    } catch (e) {
      setError(describeError(e));
      setSaving(false);
    }
  }

  return (
    <div>
      <StepHeading title="How often do you get paid?" />
      <ChoiceCardGroup options={FREQUENCIES} value={value} onChange={onChange} />

      {value !== 'irregular' && (
        <Input
          label="Day of the month you get paid"
          type="number"
          value={payDay}
          onChange={(e) => onPayDayChange(e.target.value)}
          placeholder="e.g. 25"
        />
      )}

      <StepFooter onSkip={onNext} onContinue={handleContinue} continueDisabled={saving} error={error} />
    </div>
  );
}
