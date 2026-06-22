import { useState } from 'react';
import { C } from '../../tokens.js';
import { BottomNav } from './BottomNav.jsx';
import { FAB } from './FAB.jsx';
import { OfflineBanner } from '../ui/OfflineBanner.jsx';
import { LogSheet } from '../log/LogSheet.jsx';

export function AppShell({ children }) {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.cream }}>
      <OfflineBanner />
      <main style={{ flex: 1, padding: '1.25rem 1rem 5rem', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
      <FAB onClick={() => setLogOpen(true)} />
      <BottomNav />
      {logOpen && <LogSheet onClose={() => setLogOpen(false)} />}
    </div>
  );
}
