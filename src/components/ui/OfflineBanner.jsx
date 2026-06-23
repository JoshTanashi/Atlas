import { C, F } from '../../tokens.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { useAuth } from '../../hooks/useAuth.jsx';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { session } = useAuth();
  if (isOnline || !session) return null; // guest writes are always local, so being offline never blocks a save

  return (
    <div
      style={{
        background: C.warn,
        color: C.paper,
        fontFamily: F.sans,
        fontSize: '0.85rem',
        textAlign: 'center',
        padding: '0.5rem',
      }}
    >
      You're offline — showing your last synced data. New entries need a connection to save.
    </div>
  );
}
