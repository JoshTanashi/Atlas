import { motion } from 'framer-motion';
import { C, F } from '../../tokens.js';

// Circular goal progress indicator — replaces a flat percentage with a ring that
// fills as a goal gets funded, the same "glanceable completion" pattern as a
// fitness ring, animating its sweep whenever the underlying progress changes.
export function GoalProgressRing({ progress, size = 96, strokeWidth = 8 }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const complete = clamped >= 1;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={C.line} strokeWidth={strokeWidth} />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={complete ? C.sageDeep : C.sage}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F.serif, fontSize: size * 0.22, color: complete ? C.sageDeep : C.ink,
        }}
      >
        {Math.round(clamped * 100)}%
      </div>
    </div>
  );
}
