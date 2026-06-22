import { useState } from 'react';
import { C } from '../../tokens.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { navigate } from '../../lib/nav.js';
import { supabase } from '../../lib/supabaseClient.js';
import { AuthLayout } from './AuthLayout.jsx';

export function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data.session) navigate(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthLayout title="Create your account" subtitle="Your financial journal.">
      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
        <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
        {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
        <Button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '0.75rem' }}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
        <button onClick={() => navigate('/sign-in')} style={{ background: 'none', border: 'none', color: C.sageDeep, padding: 0, cursor: 'pointer' }}>Already have an account? Sign in</button>
      </div>
    </AuthLayout>
  );
}
