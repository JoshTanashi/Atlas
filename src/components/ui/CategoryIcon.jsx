import {
  Utensils, ShoppingBasket, Fuel, HeartPulse, Smartphone,
  ShoppingBag, Repeat, Bus, CircleDashed, ArrowDownCircle,
} from 'lucide-react';
import { C } from '../../tokens.js';
import { CATEGORY_COLORS } from '../../lib/aggregates.js';

const ICONS = {
  takeaways: Utensils,
  groceries: ShoppingBasket,
  fuel: Fuel,
  health: HeartPulse,
  airtime_data: Smartphone,
  shopping: ShoppingBag,
  subscriptions: Repeat,
  transport: Bus,
  uncategorized: CircleDashed,
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CategoryIcon({ category, direction, size = 16 }) {
  const Icon = direction === 'income' ? ArrowDownCircle : (ICONS[category] ?? CircleDashed);
  const categoryColor = CATEGORY_COLORS[category];
  const color = direction === 'income' ? C.sageDeep : (categoryColor ?? C.slate);
  const background = direction === 'income'
    ? 'rgba(91, 123, 111, 0.12)'
    : (categoryColor ? hexToRgba(categoryColor, 0.12) : C.cream);

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2rem',
        height: '2rem',
        borderRadius: '50%',
        background,
        flexShrink: 0,
      }}
    >
      <Icon size={size} strokeWidth={2} color={color} />
    </span>
  );
}
