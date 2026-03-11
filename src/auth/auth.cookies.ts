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

export function getAuthCookieName(configService: ConfigService): string {
  return configService.get<string>('COOKIE_NAME') ?? 'takehome_auth';
}

export function getAuthCookieOptions(configService: ConfigService): CookieOptions {
  const nodeEnv =
    (configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development').toLowerCase();
  const isProd = nodeEnv === 'production';

  const sameSite = normalizeSameSite(configService.get<string>('COOKIE_SAME_SITE')) ?? (isProd ? 'none' : 'lax');
  const cookieSecure =
    parseBool(configService.get<string>('COOKIE_SECURE')) ?? (isProd || sameSite === 'none');

  const cookieDomainRaw = configService.get<string>('COOKIE_DOMAIN');
  const cookieDomain =
    cookieDomainRaw && !['localhost', '127.0.0.1'].includes(cookieDomainRaw.trim().toLowerCase())
      ? cookieDomainRaw.trim()
      : undefined;

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

