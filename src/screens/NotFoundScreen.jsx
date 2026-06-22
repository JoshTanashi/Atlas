import { C } from '../tokens.js';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { navigate } from '../lib/nav.js';

export function NotFoundScreen() {
  return (
    <div style={{ paddingTop: '2rem' }}>
      <EmptyState
        title="Page not found"
        body="That page doesn't exist."
        action={<Button onClick={() => navigate('/')} style={{ color: C.paper }}>Back to Dashboard</Button>}
      />
    </div>
  );
}
