import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';

// Purely motivational interstitial between onboarding categories — illustrative
// static data only, never the user's own numbers, so it can render before any
// data has been collected.
export function InfoChartStep({ icon: Icon, title, subtitle, data, caption, onNext }) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ textAlign: 'center', marginBottom: '1.5rem' }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '3rem', height: '3rem', borderRadius: '50%', background: C.paper,
            border: `1px solid ${C.line}`, marginBottom: '0.9rem',
          }}
        >
          <Icon size={20} strokeWidth={2} color={C.sageDeep} />
        </span>
        <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', color: C.ink, marginBottom: '0.5rem' }}>{title}</h1>
        <p style={{ color: C.slate, fontSize: '0.9rem', lineHeight: 1.5 }}>{subtitle}</p>
      </motion.div>

      <Card style={{ marginBottom: '1.5rem', padding: '1.5rem 1rem' }}>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 11 }} axisLine={{ stroke: C.line }} tickLine={false} />
              <Bar dataKey="value" fill={C.sageDeep} radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {caption && <p style={{ color: C.slate, fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>{caption}</p>}
      </Card>

      <Button onClick={onNext} style={{ width: '100%' }}>Continue</Button>
    </div>
  );
}
