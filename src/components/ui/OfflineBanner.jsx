import { C, F } from '../../tokens.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

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
