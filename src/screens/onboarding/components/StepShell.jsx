import { C, F } from '../../../tokens.js';
import { Button } from '../../../components/ui/Button.jsx';

export function StepHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.6rem', color: C.ink, marginBottom: '0.5rem' }}>{title}</h1>
      {subtitle && <p style={{ color: C.slate, fontSize: '0.9rem', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

export function StepFooter({ onSkip, onContinue, continueLabel = 'Continue', continueDisabled, error }) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
      <Button onClick={onContinue} disabled={continueDisabled} style={{ width: '100%', marginBottom: '0.6rem' }}>
        {continueLabel}
      </Button>
      {onSkip && (
        <Button variant="ghost" onClick={onSkip} style={{ width: '100%' }}>
          Skip for now
        </Button>
      )}
    </div>
  );
}
