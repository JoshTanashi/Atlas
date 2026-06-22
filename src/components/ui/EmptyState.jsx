import { C, F } from '../../tokens.js';
import { Card } from './Card.jsx';

export function EmptyState({ title, body, action }) {
  return (
    <Card style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}>
      <h3 style={{ fontFamily: F.serif, fontSize: '1.1rem', color: C.ink, marginBottom: '0.4rem' }}>{title}</h3>
      {body && <p style={{ color: C.slate, fontSize: '0.95rem', marginBottom: action ? '1rem' : 0 }}>{body}</p>}
      {action}
    </Card>
  );
}
