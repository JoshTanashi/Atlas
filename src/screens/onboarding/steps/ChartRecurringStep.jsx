import { Repeat } from 'lucide-react';
import { InfoChartStep } from '../components/InfoChartStep.jsx';

const DATA = [
  { label: 'Untracked', value: 850 },
  { label: 'Tracked in Atlas', value: 320, featured: true },
];

export function ChartRecurringStep({ onNext }) {
  return (
    <InfoChartStep
      icon={Repeat}
      title="Subscriptions add up fast"
      subtitle="People who track recurring expenses typically spot 2-3 forgotten subscriptions in their first month."
      data={DATA}
      caption="Illustrative — average monthly subscription spend, tracked vs untracked."
      onNext={onNext}
    />
  );
}
