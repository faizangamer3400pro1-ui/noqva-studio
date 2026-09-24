import { Capacitor } from "@capacitor/core";

export const NATIVE_AUTH_REDIRECT = "com.noqvaai.app://";

export function getAuthRedirectUrl() {
  return Capacitor.isNativePlatform() ? NATIVE_AUTH_REDIRECT : window.location.origin;
}

export function readAuthTokens(url: string) {
  const parsed = new URL(url);
  const query = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token") ?? query.get("access_token");
  const refreshToken = hash.get("refresh_token") ?? query.get("refresh_token");

  if (!accessToken || !refreshToken) return null;
  return { access_token: accessToken, refresh_token: refreshToken };
}