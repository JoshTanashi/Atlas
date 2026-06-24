import { Target } from 'lucide-react';
import { InfoChartStep } from '../components/InfoChartStep.jsx';

const DATA = [
  { label: 'No goal set', value: 1 },
  { label: 'With a goal', value: 3, featured: true },
];

export function ChartGoalsStep({ onNext }) {
  return (
    <InfoChartStep
      icon={Target}
      title="Goals make saving stick"
      subtitle="Setting a clear target with a deadline helps you save roughly 3x faster than just hoping to save."
      data={DATA}
      caption="Illustrative — relative savings progress, with vs without a goal."
      onNext={onNext}
    />
  );
}
