import { C, F } from '../../tokens.js';
import { Card } from '../../components/ui/Card.jsx';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream, padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <h1 style={{ fontFamily: F.serif, fontSize: '1.75rem', color: C.ink, textAlign: 'center', marginBottom: '0.4rem' }}>Atlas</h1>
        {subtitle && <p style={{ color: C.slate, textAlign: 'center', marginBottom: '1.5rem', fontFamily: F.sans, fontSize: '0.9rem' }}>{subtitle}</p>}
        <Card>
          {title && <h2 style={{ fontFamily: F.serif, fontSize: '1.2rem', color: C.ink, marginBottom: '1rem' }}>{title}</h2>}
          {children}
        </Card>
      </div>
    </div>
  );
}
