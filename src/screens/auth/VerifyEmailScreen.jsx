import { useState } from 'react';
import { C } from '../../tokens.js';
import { Button } from '../../components/ui/Button.jsx';
import { navigate } from '../../lib/nav.js';
import { supabase } from '../../lib/supabaseClient.js';
import { AuthLayout } from './AuthLayout.jsx';

export function VerifyEmailScreen() {
  const email = new URLSearchParams(window.location.search).get('email') ?? '';
  const [resent, setResent] = useState(false);
  const [error, setError] = useState(null);

  async function handleResend() {
    setError(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) setError(error.message);
    else setResent(true);
  }

  return (
    <AuthLayout title="Check your inbox" subtitle="One more step.">
      <p style={{ color: C.ink, fontSize: '0.95rem', marginBottom: '1rem' }}>
        We've sent a verification link{email ? ` to ${email}` : ''}. Click it to confirm your account, then sign in.
      </p>
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
      {resent && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginBottom: '0.75rem' }}>Email resent.</p>}
      <Button variant="secondary" onClick={handleResend} disabled={!email} style={{ width: '100%', marginBottom: '0.75rem' }}>
        Resend email
      </Button>
      <Button onClick={() => navigate('/sign-in')} style={{ width: '100%' }}>Back to sign in</Button>
    </AuthLayout>
  );
}
