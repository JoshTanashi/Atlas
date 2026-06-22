export function friendlyAuthError(message) {
  if (/fetch|network/i.test(message)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return message;
}
