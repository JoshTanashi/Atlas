import { useEffect, useState } from 'react';
import { C, F } from './tokens.js';
import { useRoute } from './lib/nav.js';
import { useAuth } from './hooks/useAuth.jsx';
import { EventsProvider } from './hooks/useEvents.jsx';
import { ProfileProvider, useProfile } from './hooks/useProfile.jsx';
import { migrateGuestData } from './lib/guestMigration.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { OnboardingFlow } from './screens/onboarding/OnboardingFlow.jsx';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import { TimelineScreen } from './screens/TimelineScreen.jsx';
import { SearchScreen } from './screens/SearchScreen.jsx';
import { GoalsScreen } from './screens/GoalsScreen.jsx';
import { GoalDetailScreen } from './screens/GoalDetailScreen.jsx';
import { InsightsScreen } from './screens/InsightsScreen.jsx';
import { SettingsScreen } from './screens/SettingsScreen.jsx';
import { NotFoundScreen } from './screens/NotFoundScreen.jsx';
import { WelcomeScreen } from './screens/auth/WelcomeScreen.jsx';
import { SignInScreen } from './screens/auth/SignInScreen.jsx';
import { SignUpScreen } from './screens/auth/SignUpScreen.jsx';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen.jsx';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen.jsx';
import { VerifyEmailScreen } from './screens/auth/VerifyEmailScreen.jsx';

const AUTH_PATHS = new Set(['/sign-up', '/sign-in', '/forgot-password', '/verify-email']);

function AuthRouter({ pathname }) {
  switch (pathname) {
    case '/sign-up':
      return <SignUpScreen />;
    case '/forgot-password':
      return <ForgotPasswordScreen />;
    case '/verify-email':
      return <VerifyEmailScreen />;
    default:
      return <SignInScreen />;
  }
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream }}>
      <p style={{ color: C.slate, fontFamily: F.sans }}>Loading…</p>
    </div>
  );
}

// Shown right after a guest creates/signs into an account: their local idb data
// must be copied to Supabase before guestMode is cleared, otherwise the normal
// authed refresh() paths would overwrite it with empty remote data first.
function GuestMigrationGate({ session }) {
  const { exitGuestMode } = useAuth();
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    migrateGuestData(session)
      .then(() => {
        if (!cancelled) exitGuestMode();
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [session, exitGuestMode, attempt]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: C.cream,
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: C.ink, fontFamily: F.sans }}>
          We couldn't move your local data to your new account. Your data is safe on this device — try again.
        </p>
        <button
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
          style={{
            background: C.ink,
            color: C.paper,
            border: 'none',
            borderRadius: '10px',
            padding: '0.6rem 1.2rem',
            fontFamily: F.sans,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return <LoadingScreen />;
}

function AppRouter({ pathname }) {
  if (pathname === '/') return <DashboardScreen />;
  if (pathname === '/timeline') return <TimelineScreen />;
  if (pathname === '/search') return <SearchScreen />;
  if (pathname === '/goals') return <GoalsScreen />;
  if (pathname === '/insights') return <InsightsScreen />;
  if (pathname === '/settings') return <SettingsScreen />;
  const goalMatch = pathname.match(/^\/goals\/([^/]+)$/);
  if (goalMatch) return <GoalDetailScreen goalId={goalMatch[1]} />;
  return <NotFoundScreen />;
}

export default function App() {
  const { session, guestMode, loading } = useAuth();
  const pathname = useRoute();

  // The password-recovery link establishes a Supabase session on load, so this
  // route must render outside the normal session-gated check below.
  if (pathname === '/reset-password') {
    return <ResetPasswordScreen />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // A guest can always reach the auth screens (e.g. to upgrade to Pro), even
  // though they otherwise skip the sign-in gate below.
  if (!session && AUTH_PATHS.has(pathname)) {
    return <AuthRouter pathname={pathname} />;
  }

  if (!session && !guestMode) {
    return <WelcomeScreen />;
  }

  if (session && guestMode) {
    return <GuestMigrationGate session={session} />;
  }

  return (
    <EventsProvider>
      <ProfileProvider>
        <AuthedApp session={session} pathname={pathname} />
      </ProfileProvider>
    </EventsProvider>
  );
}

function AuthedApp({ session, pathname }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return <LoadingScreen />;
  }

  if (profile && !profile.onboarding_completed_at) {
    return <OnboardingFlow />;
  }

  return (
    <AppShell>
      {session && !session.user.email_confirmed_at && (
        <div
          style={{
            background: C.warn,
            color: C.paper,
            fontSize: '0.8rem',
            padding: '0.6rem 0.9rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontFamily: F.sans,
          }}
        >
          Verify your email to keep your account secure — check your inbox for a link.
        </div>
      )}
      <AppRouter pathname={pathname} />
    </AppShell>
  );
}
