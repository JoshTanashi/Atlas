import { useState } from 'react';
import { ChevronLeft, User, Crown, Lock, MessageSquare, Info, LogOut, Trash2 } from 'lucide-react';
import { C, F } from '../tokens.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { navigate } from '../lib/nav.js';
import { friendlyAuthError } from '../lib/authError.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import { supabase } from '../lib/supabaseClient.js';

function SectionLabel({ children }) {
  return <p className="label" style={{ marginBottom: '0.6rem' }}>{children}</p>;
}

function IconBadge({ icon: Icon, color = C.sageDeep, background = C.cream }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '50%', background, flexShrink: 0 }}>
      <Icon size={16} strokeWidth={2} color={color} />
    </span>
  );
}

function CardHeader({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
      <IconBadge icon={icon} />
      <span style={{ color: C.ink, fontSize: '0.95rem', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { profile, updateDisplayName } = useProfile();

  return (
    <div>
      <button onClick={() => navigate('/me')} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', color: C.slate, marginBottom: '1rem', padding: 0 }}>
        <ChevronLeft size={18} strokeWidth={2} /> Me
      </button>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Settings</h1>

      <SectionLabel>Profile</SectionLabel>
      <ProfileCard email={session?.user?.email} displayName={profile?.display_name} onSave={updateDisplayName} />

      <SectionLabel>Subscription</SectionLabel>
      <SubscriptionCard profile={profile} />

      <SectionLabel>Security</SectionLabel>
      <PasswordCard />

      <SectionLabel>Feedback</SectionLabel>
      <FeedbackCard userId={session?.user?.id} />

      <SectionLabel>About</SectionLabel>
      <Card style={{ marginBottom: '1rem' }}>
        <CardHeader icon={Info} label="Atlas" />
        <p style={{ color: C.slate, fontSize: '0.85rem' }}>Version 1.0 — a calm, honest journal for your money.</p>
      </Card>

      <SectionLabel>Account</SectionLabel>
      <AccountCard signOut={signOut} />
    </div>
  );
}

function AccountCard({ signOut }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function handleDeleteAccount() {
    if (!window.confirm('This permanently deletes your account and all data. This cannot be undone. Continue?')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await signOut();
    } catch {
      setDeleteError('Could not delete your account. Please try again, or contact support.');
      setDeleting(false);
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <Button variant="ghost" onClick={signOut} style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <LogOut size={16} strokeWidth={2} /> Sign out
      </Button>
      {deleteError && <p style={{ color: C.over, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{deleteError}</p>}
      <Button
        variant="ghost"
        onClick={handleDeleteAccount}
        disabled={deleting}
        style={{ width: '100%', color: C.over, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <Trash2 size={16} strokeWidth={2} /> {deleting ? 'Deleting…' : 'Delete my account and all data'}
      </Button>
    </Card>
  );
}

function ProfileCard({ email, displayName, onSave }) {
  const [name, setName] = useState(displayName ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await onSave(name);
      setSaved(true);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to save changes." : 'Could not save. Please try again.');
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={User} label="Display name" />
      <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{email}</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Your name" />
        <Button style={{ height: 'fit-content' }} onClick={handleSave}>Save</Button>
      </div>
      {saved && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Saved.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </Card>
  );
}

function SubscriptionCard({ profile }) {
  const planLabel = profile?.pro_plan ? `${profile.pro_plan[0].toUpperCase()}${profile.pro_plan.slice(1)}` : 'Pro access';
  const renewal = profile?.pro_current_period_end
    ? new Date(profile.pro_current_period_end).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={Crown} label={profile?.is_pro ? 'Atlas Pro' : 'Free plan'} />
      {profile?.is_pro ? (
        <p style={{ color: C.slate, fontSize: '0.85rem' }}>
          {planLabel}{renewal ? ` — renews ${renewal}` : ''}
        </p>
      ) : (
        <>
          <p style={{ color: C.slate, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            Unlock AI insights, forecasting, and more.
          </p>
          <Button onClick={() => navigate('/insights')} style={{ width: '100%' }}>Upgrade to Pro</Button>
        </>
      )}
    </Card>
  );
}

function PasswordCard() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirm('');
      setSaved(true);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to change your password." : friendlyAuthError(e.message));
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={Lock} label="Change password" />
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
      <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
      <Button onClick={handleSave} style={{ width: '100%' }}>Update password</Button>
      {saved && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Password updated.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </Card>
  );
}

function FeedbackCard({ userId }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend() {
    if (!message.trim()) return;
    setError(null);
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');
      const { error: insertError } = await supabase.from('feedback').insert({ user_id: userId, message: message.trim() });
      if (insertError) throw insertError;
      setMessage('');
      setSent(true);
    } catch (e) {
      setError(e.message === 'OFFLINE' ? "You're offline — connect to send feedback." : 'Could not send feedback. Please try again.');
    }
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader icon={MessageSquare} label="Send feedback" />
      <textarea
        value={message}
        onChange={(e) => { setMessage(e.target.value); setSent(false); }}
        placeholder="What's working, what's not — tell us anything."
        rows={3}
        style={{
          width: '100%',
          fontFamily: F.sans,
          fontSize: '0.95rem',
          padding: '0.75rem 0.9rem',
          borderRadius: '10px',
          border: `1px solid ${C.line}`,
          background: C.paper,
          color: C.ink,
          outline: 'none',
          resize: 'vertical',
          marginBottom: '0.75rem',
        }}
      />
      <Button onClick={handleSend} style={{ width: '100%' }}>Send</Button>
      {sent && <p style={{ color: C.sageDeep, fontSize: '0.85rem', marginTop: '0.4rem' }}>Thanks — we read every one.</p>}
      {error && <p style={{ color: C.over, fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
    </Card>
  );
}
