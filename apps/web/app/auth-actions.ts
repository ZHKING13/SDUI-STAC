'use server';

import { redirect } from 'next/navigation';
import {
  invitationAcceptSchema,
  loginLinkRequestSchema,
  loginSchema,
  type SessionDto,
} from '@famille/shared';
import { parseForm, type FormState } from '@/lib/form-state';
import { ApiError, apiFetch, clearSessionCookie, safeNextPath, setSessionCookie } from '@/lib/session';

const errorState = (error: unknown, values?: Record<string, string>): FormState => {
  if (error instanceof ApiError) {
    return { status: 'error', message: error.message, errors: error.errors, values };
  }
  console.error(error);
  return { status: 'error', message: 'Le service est momentanément indisponible. Merci de réessayer.', values };
};

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const form = parseForm(formData, loginSchema);
  if (!form.ok) return form.state;
  try {
    const session = await apiFetch<SessionDto>('/auth/login', { body: form.data, auth: false });
    await setSessionCookie(session);
  } catch (error) {
    return errorState(error, { email: form.values.email ?? '' });
  }
  redirect(safeNextPath(formData.get('suite')));
}

export async function requestLoginLinkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const form = parseForm(formData, loginLinkRequestSchema);
  if (!form.ok) return form.state;
  try {
    await apiFetch('/auth/login-link', { body: form.data, auth: false });
  } catch (error) {
    return errorState(error, form.values);
  }
  return {
    status: 'success',
    message:
      'Si cette adresse correspond à un compte, un lien de connexion vient de vous être envoyé. Pensez à regarder dans les courriers indésirables.',
  };
}

/** Le lien reçu par e-mail ouvre une page avec un bouton : les robots de messagerie ne peuvent pas l'utiliser à votre place. */
export async function verifyLoginLinkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const session = await apiFetch<SessionDto>('/auth/login-link/verify', {
      body: { token: String(formData.get('token') ?? '') },
      auth: false,
    });
    await setSessionCookie(session);
  } catch (error) {
    return errorState(error);
  }
  redirect('/espace-famille');
}

export async function acceptInvitationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const form = parseForm(formData, invitationAcceptSchema);
  if (!form.ok) return form.state;
  try {
    const session = await apiFetch<SessionDto>('/invitations/accept', { body: form.data, auth: false });
    await setSessionCookie(session);
  } catch (error) {
    return errorState(error, { firstName: form.values.firstName ?? '', lastName: form.values.lastName ?? '' });
  }
  redirect('/espace-famille?bienvenue=1');
}

export async function logoutAction(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Session déjà expirée : il suffit d'effacer le cookie.
  }
  await clearSessionCookie();
  redirect('/');
}
