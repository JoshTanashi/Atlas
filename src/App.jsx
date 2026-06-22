import { C, F } from './tokens.js';
import { useRoute } from './lib/nav.js';
import { useAuth } from './hooks/useAuth.jsx';
import { EventsProvider } from './hooks/useEvents.jsx';
import { ProfileProvider } from './hooks/useProfile.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import { TimelineScreen } from './screens/TimelineScreen.jsx';
import { SearchScreen } from './screens/SearchScreen.jsx';
import { GoalsScreen } from './screens/GoalsScreen.jsx';
import { GoalDetailScreen } from './screens/GoalDetailScreen.jsx';
import { InsightsScreen } from './screens/InsightsScreen.jsx';
import { MeScreen } from './screens/MeScreen.jsx';
import { NotFoundScreen } from './screens/NotFoundScreen.jsx';
import { SignInScreen } from './screens/auth/SignInScreen.jsx';
import { SignUpScreen } from './screens/auth/SignUpScreen.jsx';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen.jsx';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen.jsx';
import { VerifyEmailScreen } from './screens/auth/VerifyEmailScreen.jsx';

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

function AppRouter({ pathname }) {
  if (pathname === '/') return <DashboardScreen />;
  if (pathname === '/timeline') return <TimelineScreen />;
  if (pathname === '/search') return <SearchScreen />;
  if (pathname === '/goals') return <GoalsScreen />;
  if (pathname === '/insights') return <InsightsScreen />;
  if (pathname === '/me') return <MeScreen />;
  const goalMatch = pathname.match(/^\/goals\/([^/]+)$/);
  if (goalMatch) return <GoalDetailScreen goalId={goalMatch[1]} />;
  return <NotFoundScreen />;
}

export default function App() {
  const { session, loading } = useAuth();
  const pathname = useRoute();

  // The password-recovery link establishes a Supabase session on load, so this
  // route must render outside the normal session-gated check below.
  if (pathname === '/reset-password') {
    return <ResetPasswordScreen />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream }}>
        <p style={{ color: C.slate, fontFamily: F.sans }}>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthRouter pathname={pathname} />;
  }

  return (
    <EventsProvider>
      <ProfileProvider>
        <AppShell>
          {!session.user.email_confirmed_at && (
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
      </ProfileProvider>
    </EventsProvider>
  );
}
