import { motion } from 'framer-motion';
import { C, F } from '../../../tokens.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';

const SPARKLE_OFFSETS_PX = [-16, 0, 16];

// A few dots drifting upward over the winning bar — a touch of life on an
// otherwise static comparison, echoing the spark-burst pattern used in
// GoalCelebration without the one-shot "explosion" (this loops, since the
// step can sit on screen indefinitely).
function FloatingSparkles() {
  return (
    <div style={{ position: 'absolute', top: '-0.5rem', left: 0, right: 0, height: 0, pointerEvents: 'none' }}>
      {SPARKLE_OFFSETS_PX.map((x, i) => (
        <motion.span
          key={x}
          animate={{ y: [0, -16, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: `calc(50% + ${x}px)`, width: '5px', height: '5px',
            borderRadius: '50%', background: C.clay,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedCompareBars({ data }) {
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2.5rem', height: 190 }}>
      {data.map((d, i) => {
        const heightPct = Math.max(6, (d.value / max) * 100);
        const isWinner = d.featured;
        return (
          <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '5.5rem' }}>
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.3 }}
              style={{ fontFamily: F.serif, fontSize: '1.15rem', color: C.ink, marginBottom: '0.4rem' }}
            >
              {d.value}
            </motion.span>
            <div style={{ position: 'relative', width: '100%', height: 130, display: 'flex', alignItems: 'flex-end' }}>
              {isWinner && <FloatingSparkles />}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.2 }}
                style={{
                  width: '100%',
                  borderRadius: '10px 10px 3px 3px',
                  background: isWinner ? `linear-gradient(180deg, ${C.sage}, ${C.sageDeep})` : C.line,
                  boxShadow: isWinner ? `0 6px 16px -6px ${C.sageDeep}` : 'none',
                }}
              />
            </div>
            <span style={{ color: C.slate, fontSize: '0.78rem', textAlign: 'center', marginTop: '0.6rem', lineHeight: 1.3 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

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
        <AnimatedCompareBars data={data} />
        {caption && <p style={{ color: C.slate, fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>{caption}</p>}
      </Card>

      <Button onClick={onNext} style={{ width: '100%' }}>Continue</Button>
    </div>
  );
}
