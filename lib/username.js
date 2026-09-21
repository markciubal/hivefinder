/**
 * What a username may be.
 *
 * Usernames used to be a display handle sitting next to an email address. They
 * are now the whole identity: the thing you log in with, and the only label
 * anyone can find you by. That raises the bar on validation, so the rules live
 * here and are imported by both the signup form and /api/auth/register -
 * client-side checks are a courtesy, the route is what actually enforces them.
 *
 * "@" is not in the allowed set on purpose. Without it nobody can use their
 * email address as a username, which would put an address back in the database
 * through the front door we just closed.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 32;

/**
 * Letters, digits, and . _ - inside; must start and end with a letter or
 * digit. Keeps out leading/trailing punctuation and names made entirely of
 * dots, which are hard to read back off a piece of paper.
 */
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/i;

export const USERNAME_HINT =
  "3-32 characters: letters, numbers, dots, dashes and underscores.";

/** Trim only. Case is preserved as typed; comparison is case-insensitive. */
export function cleanUsername(raw) {
  return String(raw ?? "").trim();
}

/**
 * A human-readable reason the username is unacceptable, or null if it is fine.
 * One message per problem, so the form can say what to fix.
 */
export function usernameError(raw) {
  const name = cleanUsername(raw);

  if (!name) return "Choose a username.";
  if (name.length < USERNAME_MIN) {
    return `Usernames need at least ${USERNAME_MIN} characters.`;
  }
  if (name.length > USERNAME_MAX) {
    return `Usernames can be at most ${USERNAME_MAX} characters.`;
  }
  if (name.includes("@")) {
    return "Usernames cannot contain \"@\". HiveFinder does not use email addresses.";
  }
  if (!USERNAME_PATTERN.test(name)) {
    return `Use ${USERNAME_HINT.toLowerCase()} Start and end with a letter or number.`;
  }
  return null;
}
