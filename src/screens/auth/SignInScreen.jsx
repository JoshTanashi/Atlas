import { useState } from 'react';
import { C } from '../../tokens.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { navigate } from '../../lib/nav.js';
import { supabase } from '../../lib/supabaseClient.js';
import { friendlyAuthError } from '../../lib/authError.js';
import { AuthLayout } from './AuthLayout.jsx';

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : friendlyAuthError(error.message));
  }

  return (
    <AuthLayout title="Sign in" subtitle="Your financial journal.">
      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
        <Button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '0.75rem' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <button onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', color: C.slate, padding: 0, cursor: 'pointer' }}>Forgot password?</button>
        <button onClick={() => navigate('/sign-up')} style={{ background: 'none', border: 'none', color: C.sageDeep, padding: 0, cursor: 'pointer' }}>Create account</button>
      </div>
    </AuthLayout>
  );
}
