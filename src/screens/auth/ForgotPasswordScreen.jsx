import { useState } from 'react';
import { C } from '../../tokens.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { navigate } from '../../lib/nav.js';
import { supabase } from '../../lib/supabaseClient.js';
import { AuthLayout } from './AuthLayout.jsx';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="Password reset">
        <p style={{ color: C.ink, fontSize: '0.95rem', marginBottom: '1rem' }}>
          If an account exists for {email}, we've sent a link to reset your password.
        </p>
        <Button onClick={() => navigate('/sign-in')} style={{ width: '100%' }}>Back to sign in</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link.">
      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
        <Button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '0.75rem' }}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
        <button onClick={() => navigate('/sign-in')} style={{ background: 'none', border: 'none', color: C.slate, padding: 0, cursor: 'pointer' }}>Back to sign in</button>
      </div>
    </AuthLayout>
  );
}
