import {
  Utensils, ShoppingBasket, Fuel, HeartPulse, Smartphone,
  ShoppingBag, Repeat, Bus, CircleDashed, ArrowDownCircle,
} from 'lucide-react';
import { C } from '../../tokens.js';

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

export function CategoryIcon({ category, direction, size = 16 }) {
  const Icon = direction === 'income' ? ArrowDownCircle : (ICONS[category] ?? CircleDashed);
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2rem',
        height: '2rem',
        borderRadius: '50%',
        background: direction === 'income' ? 'rgba(91, 123, 111, 0.12)' : C.cream,
        flexShrink: 0,
      }}
    >
      <Icon size={size} strokeWidth={2} color={direction === 'income' ? C.sageDeep : C.slate} />
    </span>
  );
}
