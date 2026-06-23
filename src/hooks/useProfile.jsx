import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { loadGuestProfile, saveGuestProfile } from '../lib/guestStore.js';
import { useAuth } from './useAuth.jsx';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { session, guestMode } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session && !guestMode) return;

    if (!session) {
      setProfile(loadGuestProfile());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, is_pro, pro_plan, pro_current_period_end, onboarding_completed_at, essential_categories')
      .eq('id', session.user.id)
      .maybeSingle();
    if (!error && data) setProfile(data);
    setLoading(false);
  }, [session, guestMode]);

  useEffect(() => { refresh(); }, [refresh]);

  async function updateDisplayName(displayName) {
    if (!session) {
      setProfile(saveGuestProfile({ ...loadGuestProfile(), display_name: displayName }));
      return;
    }
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', session.user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, display_name: displayName }));
  }

  async function updateEssentialCategories(categories) {
    if (!session) {
      setProfile(saveGuestProfile({ ...loadGuestProfile(), essential_categories: categories }));
      return;
    }
    if (!navigator.onLine) throw new Error('OFFLINE');
    const { error } = await supabase
      .from('profiles')
      .update({ essential_categories: categories })
      .eq('id', session.user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, essential_categories: categories }));
  }

  async function completeOnboarding() {
    const completedAt = new Date().toISOString();
    if (!session) {
      setProfile(saveGuestProfile({ ...loadGuestProfile(), onboarding_completed_at: completedAt }));
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed_at: completedAt })
      .eq('id', session.user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, onboarding_completed_at: completedAt }));
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, updateDisplayName, updateEssentialCategories, completeOnboarding }}>
      {children}
    </ProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook are intentionally co-located
export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
