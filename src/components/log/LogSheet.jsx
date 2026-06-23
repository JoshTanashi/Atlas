import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { C, F } from '../../tokens.js';
import { Button } from '../ui/Button.jsx';
import { AmountInput } from '../ui/AmountInput.jsx';
import { MerchantStep } from './MerchantStep.jsx';
import { DetailExpander } from './DetailExpander.jsx';
import { matchMerchant, normalizeMerchant } from '../../lib/merchantMatch.js';
import { useEvents } from '../../hooks/useEvents.jsx';
import { useMerchantCorrections } from '../../hooks/useMerchantCorrections.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

const STEPS = { AMOUNT: 'amount', MERCHANT: 'merchant' };
const SAVED_FEEDBACK_MS = 550;

export function LogSheet({ onClose }) {
  const [step, setStep] = useState(STEPS.AMOUNT);
  const [digits, setDigits] = useState('');
  const [merchant, setMerchant] = useState('');
  const [direction, setDirection] = useState('expense');
  const [note, setNote] = useState('');
  const [categoryOverride, setCategoryOverride] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const { logEvent } = useEvents();
  const { corrections, saveCorrection } = useMerchantCorrections();
  const isOnline = useOnlineStatus();

  const amountCents = Number(digits || '0');
  const suggestedCategory = useMemo(
    () => (merchant ? matchMerchant(merchant, corrections) : 'uncategorized'),
    [merchant, corrections]
  );
  const finalCategory = categoryOverride ?? suggestedCategory;

  function addDigit(d) {
    setDigits((prev) => (prev.length >= 9 ? prev : prev + d));
  }
  function backspace() {
    setDigits((prev) => prev.slice(0, -1));
  }

  async function handleSave() {
    if (!merchant.trim() || amountCents === 0) return;
    setSaving(true);
    setError(null);
    try {
      const normalizedMerchant = normalizeMerchant(merchant);
      if (categoryOverride && categoryOverride !== suggestedCategory) {
        await saveCorrection(normalizedMerchant, categoryOverride);
      }
      await logEvent({
        amountCents,
        direction,
        merchant: merchant.trim(),
        category: finalCategory,
        note: note.trim() || null,
      });
      setSaved(true);
      setTimeout(onClose, SAVED_FEEDBACK_MS);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to save this entry." : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(43, 42, 38, 0.35)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          background: C.cream,
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem 1.25rem 2rem',
          maxHeight: '88vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0, background: C.cream, borderRadius: '20px 20px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
              }}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: C.sage,
                }}
              >
                <Check size={28} strokeWidth={3} color={C.paper} />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: F.serif, fontSize: '1.2rem', color: C.ink }}>Log an entry</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.slate, fontSize: '1.2rem' }}>✕</button>
        </div>

        {step === STEPS.AMOUNT && (
          <>
            <AmountInput digits={digits} onDigit={addDigit} onBackspace={backspace} />
            <Button
              variant="primary"
              disabled={amountCents === 0}
              onClick={() => setStep(STEPS.MERCHANT)}
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              Next
            </Button>
          </>
        )}

        {step === STEPS.MERCHANT && (
          <>
            <MerchantStep merchant={merchant} onChange={setMerchant} suggestedCategory={suggestedCategory} />
            <DetailExpander
              note={note}
              onNoteChange={setNote}
              category={finalCategory}
              onCategoryChange={setCategoryOverride}
              direction={direction}
              onDirectionChange={setDirection}
            />
            {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.75rem' }}>{error}</p>}
            <Button
              variant="primary"
              disabled={!merchant.trim() || saving || !isOnline}
              onClick={handleSave}
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              {saving ? 'Saving…' : isOnline ? 'Save' : 'Connect to save'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
