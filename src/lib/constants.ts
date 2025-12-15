/**
 * Prefix for storing Semaphore identities in localStorage.
 * Full key format: `${IDENTITY_STORAGE_PREFIX}${groupId}`
 */
export const IDENTITY_STORAGE_PREFIX = "semaphore-identity-";

/**
 * Custom event name for identity changes.
 */
export const IDENTITY_CHANGED_EVENT = "identity-changed";

/**
 * Helper to get the full storage key for a group's identity.
 */
export function getIdentityStorageKey(groupId: string): string {
  return `${IDENTITY_STORAGE_PREFIX}${groupId}`;
}

/**
 * Helper to extract groupId from a storage key.
 */
export function getGroupIdFromStorageKey(key: string): string | null {
  if (!key.startsWith(IDENTITY_STORAGE_PREFIX)) {
    return null;
  }
  return key.replace(IDENTITY_STORAGE_PREFIX, "");
}

/**
 * Dispatch an event to notify listeners that identity has changed.
 */
export function notifyIdentityChanged(): void {
  window.dispatchEvent(new CustomEvent(IDENTITY_CHANGED_EVENT));
}
