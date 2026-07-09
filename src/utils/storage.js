/**
 * Storage abstraction layer.
 * Every read/write in the application goes through this module.
 * When AR Airways gets a backend, replace these four functions
 * with API calls. Nothing upstream changes.
 */

const NAMESPACE = "ar_airways";

function prefixed(key) {
  return `${NAMESPACE}:${key}`;
}

export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(prefixed(key));
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(prefixed(key), JSON.stringify(value));
  } catch {
    // Private mode or quota exceeded — degrade silently.
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(prefixed(key));
  } catch {
    // Ignore.
  }
}

export function storageHas(key) {
  try {
    return localStorage.getItem(prefixed(key)) !== null;
  } catch {
    return false;
  }
}
