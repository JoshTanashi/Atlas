import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { clearAllCaches } from '../lib/db.js';
import { isGuestModeFlagSet, setGuestModeFlag, clearGuestModeFlag, clearGuestProfile } from '../lib/guestStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [guestMode, setGuestMode] = useState(isGuestModeFlagSet);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  function enterGuestMode() {
    setGuestModeFlag();
    setGuestMode(true);
  }

  // Called only once a guest's local data has been migrated to their new account —
  // until then `session && guestMode` both being true is the signal to run that migration.
  function exitGuestMode() {
    clearGuestModeFlag();
    clearGuestProfile();
    setGuestMode(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    await clearAllCaches();
    exitGuestMode();
  }

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined, guestMode, enterGuestMode, exitGuestMode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook are intentionally co-located
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
