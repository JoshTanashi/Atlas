import { useState } from 'react';
import { C } from '../../tokens.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { navigate } from '../../lib/nav.js';
import { supabase } from '../../lib/supabaseClient.js';
import { friendlyAuthError } from '../../lib/authError.js';
import { AuthLayout } from './AuthLayout.jsx';

export function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(friendlyAuthError(error.message)); return; }
    setDone(true);
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You're all set.">
        <Button onClick={() => navigate('/')} style={{ width: '100%' }}>Continue to Atlas</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something secure.">
      <form onSubmit={handleSubmit}>
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required autoFocus />
        <Input label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
        {error && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
        <Button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
