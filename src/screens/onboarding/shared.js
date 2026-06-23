export function describeError(e) {
  return e.message === 'OFFLINE' ? "You're offline — you can add this later from Settings." : 'Could not save. You can add this later from Settings.';
}
