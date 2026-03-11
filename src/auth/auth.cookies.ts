import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

type SameSite = 'lax' | 'strict' | 'none';

function parseBool(v: string | undefined): boolean | undefined {
  if (v === undefined) return undefined;
  const normalized = v.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return undefined;
}

function normalizeSameSite(v: string | undefined): SameSite | undefined {
  if (!v) return undefined;
  const s = v.trim().toLowerCase();
  if (s === 'lax' || s === 'strict' || s === 'none') return s;
  return undefined;
}

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim();
  if (!trimmed) return '';
  if (trimmed === '*') return '*';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
}

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((v) => normalizeOrigin(v))
    .filter((v) => v.length > 0);
}

function isLocalOrigin(origin: string): boolean {
  if (origin === '*') return false;
  try {
    const parsed = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function getOriginHost(origin: string): string | undefined {
  if (origin === '*') return undefined;
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function normalizeCookieDomain(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^\.+/, '').toLowerCase();
  if (!trimmed) return undefined;
  if (['localhost', '127.0.0.1'].includes(trimmed)) return undefined;
  if (!/^[a-z0-9.-]+$/.test(trimmed)) return undefined;
  if (!trimmed.includes('.')) return undefined;
  return trimmed;
}

export function getAuthCookieName(configService: ConfigService): string {
  return configService.get<string>('COOKIE_NAME') ?? 'takehome_auth';
}

export function getAuthCookieOptions(configService: ConfigService): CookieOptions {
  const nodeEnv =
    (configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development').toLowerCase();
  const isProd = nodeEnv === 'production';

  const configuredCorsOrigins = parseCorsOrigins(configService.get<string>('APP_CORS_ORIGIN'));
  const hasRemoteCorsOrigin = configuredCorsOrigins.some((origin) => !isLocalOrigin(origin));
  const shouldUseCrossSiteCookies = isProd || hasRemoteCorsOrigin;

  const sameSite =
    normalizeSameSite(configService.get<string>('COOKIE_SAME_SITE')) ??
    (shouldUseCrossSiteCookies ? 'none' : 'lax');
  const cookieSecure =
    parseBool(configService.get<string>('COOKIE_SECURE')) ??
    (shouldUseCrossSiteCookies || sameSite === 'none');

  const cookieDomainRaw = configService.get<string>('COOKIE_DOMAIN');
  const cookieDomainCandidate = normalizeCookieDomain(cookieDomainRaw);
  const configuredCorsHosts = configuredCorsOrigins
    .map((origin) => getOriginHost(origin))
    .filter((host): host is string => Boolean(host));

  // A backend cannot set cookies for an unrelated frontend host.
  const cookieDomain =
    cookieDomainCandidate && configuredCorsHosts.includes(cookieDomainCandidate)
      ? undefined
      : cookieDomainCandidate;

  const maxAgeMsRaw = configService.get<string>('COOKIE_MAX_AGE_MS');
  const maxAge = maxAgeMsRaw ? Number(maxAgeMsRaw) : 1000 * 60 * 60;

  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite,
    domain: cookieDomain,
    maxAge: Number.isFinite(maxAge) ? maxAge : 1000 * 60 * 60,
    path: '/',
  };
}

