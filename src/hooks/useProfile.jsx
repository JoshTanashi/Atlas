import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from './useAuth.jsx';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('is_pro, pro_plan, pro_current_period_end')
      .eq('id', session.user.id)
      .maybeSingle();
    if (!error && data) setProfile(data);
    setLoading(false);
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh }}>
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
