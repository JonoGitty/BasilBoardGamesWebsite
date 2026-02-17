const CROWN = '\u{1F451}';

/** Trim + collapse internal whitespace. */
export function normalizeNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Normalize + lowercase — matches the DB canonical form. */
export function canonicalizeNickname(raw: string): string {
  return normalizeNickname(raw).toLowerCase();
}

/** True if the string contains the crown emoji (U+1F451). */
export function containsCrown(str: string): boolean {
  return str.includes(CROWN);
}

/** Returns an error message or null if valid. */
export function validateNickname(nickname: string, isAdmin: boolean): string | null {
  const trimmed = normalizeNickname(nickname);

  if (trimmed.length > 20) {
    return 'Nickname must be 20 characters or fewer';
  }

  if (!isAdmin && containsCrown(trimmed)) {
    return 'Only admins can use 👑 in nicknames';
  }

  return null;
}
