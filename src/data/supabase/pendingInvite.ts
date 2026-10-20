const KEY = 'pendingInvite'

// localStorage, not sessionStorage: the email link usually opens in a new tab, which has its own sessionStorage.
// Storage can be blocked (private windows), so every access is guarded and the app still works without it.
export function rememberInvite(code: string): void {
  try {
    localStorage.setItem(KEY, code)
  } catch {
    // Without storage the user opens the invite link again after signing in.
  }
}

export function readPendingInvite(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
