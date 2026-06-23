import { Wallet, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';

const BENEFITS = [
  { icon: Wallet, text: 'Log spending in seconds and see where your money actually goes.' },
  { icon: Target, text: 'Set savings goals and watch your progress build automatically.' },
  { icon: Sparkles, text: 'Pro unlocks AI insights and a forecast of your month ahead.' },
  { icon: ShieldCheck, text: 'Your data is private, encrypted, and yours to export any time.' },
];

export function IntroStep({ onNext }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ fontFamily: F.serif, fontSize: '2rem', color: C.ink, marginBottom: '0.5rem' }}>Welcome to Atlas</p>
        <p style={{ color: C.slate, fontSize: '0.95rem', lineHeight: 1.5 }}>
          A calm, honest journal for your money. A few quick questions will help Atlas understand your finances
          so it can work for you from day one.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
        {BENEFITS.map(({ icon: Icon, text }) => (
          <Card key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: C.cream, flexShrink: 0 }}>
              <Icon size={18} strokeWidth={2} color={C.sageDeep} />
            </span>
            <p style={{ color: C.ink, fontSize: '0.88rem', lineHeight: 1.4, paddingTop: '0.2rem' }}>{text}</p>
          </Card>
        ))}
      </div>
      <Button onClick={onNext} style={{ width: '100%' }}>Get started</Button>
    </div>
  );
}
