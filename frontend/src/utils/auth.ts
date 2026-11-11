const TOKEN_KEY = 'GD_TRAVEL_ACCESS_TOKEN';

export const AUTH_NOTICE_KEY = 'GD_TRAVEL_AUTH_NOTICE';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 只允许站内跳转，避免开放重定向。
 */
export function getSafeRedirect(redirect: string | null | undefined, fallback = '/dashboard'): string {
  if (!redirect) return fallback;
  if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/login')) {
    return fallback;
  }
  return redirect;
}
