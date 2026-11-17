import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SESSION_TTL_DAYS, type FieldErrors, type MeDto, type SessionDto } from '@famille/shared';
import { API_URL } from './api';

/**
 * Le jeton de session vit dans un cookie httpOnly du site ; le navigateur ne le voit jamais.
 * Les pages et actions serveur appellent l'API en le transmettant (en-tête Authorization).
 */
export const SESSION_COOKIE = 'famille_session';

export async function setSessionCookie(session: SessionDto) {
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: (process.env.SITE_URL ?? '').startsWith('https://'),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: FieldErrors,
  ) {
    super(message);
  }
}

/** Appel de l'API depuis le serveur Next.js, avec la session et l'adresse IP du visiteur. */
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const token = init.auth === false ? null : await getSessionToken();
  const forwardedFor = (await headers()).get('x-forwarded-for');
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    headers: {
      ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      res.status === 429
        ? 'Trop de tentatives depuis votre connexion. Merci de réessayer un peu plus tard.'
        : (typeof body?.message === 'string' && body.message) || 'Une erreur est survenue.';
    throw new ApiError(res.status, message, body?.errors);
  }
  return body as T;
}

/** Membre connecté, ou null. Mis en cache le temps d'une requête. */
export const getMe = cache(async (): Promise<MeDto | null> => {
  if (!(await getSessionToken())) return null;
  try {
    return await apiFetch<MeDto>('/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

/** Pour les pages de l'espace famille : renvoie le membre ou redirige vers la connexion. */
export async function requireMe(): Promise<MeDto> {
  const me = await getMe();
  if (!me) redirect('/connexion');
  return me;
}

/** N'accepte qu'une redirection interne vers l'espace famille (pas de redirection ouverte). */
export function safeNextPath(value: unknown): string {
  return typeof value === 'string' && /^\/espace-famille(\/[\w\-/]*)?(\?[\w=&%-]*)?$/.test(value)
    ? value
    : '/espace-famille';
}
