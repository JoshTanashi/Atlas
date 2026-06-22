import { C, F } from '../../tokens.js';
import { Search } from 'lucide-react';
import { navigate } from '../../lib/nav.js';

function IconButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.25rem',
        height: '2.25rem',
        borderRadius: '50%',
        border: `1px solid ${C.line}`,
        background: C.paper,
        color: C.slate,
      }}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}

export function ScreenHeader({ title, action, showSearch }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
      <h1 style={{ fontFamily: F.serif, fontSize: '1.5rem', color: C.ink }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {action}
        {showSearch && <IconButton icon={Search} label="Search" onClick={() => navigate('/search')} />}
      </div>
    </div>
  );
}
