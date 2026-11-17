'use server';

import { headers } from 'next/headers';
import {
  contactMessageSchema,
  joinRequestSchema,
  toFieldErrors,
  type FieldErrors,
} from '@famille/shared';
import type { ZodTypeAny } from 'zod';
import { API_URL } from '@/lib/api';

export type { FormState } from '@/lib/form-state';
import type { FormState } from '@/lib/form-state';

const GENERIC_ERROR = "L'envoi n'a pas abouti. Merci de réessayer dans quelques minutes.";

async function submit(
  formData: FormData,
  schema: ZodTypeAny,
  path: string,
  successMessage: string,
): Promise<FormState> {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([key]) => !key.startsWith('$')).map(([k, v]) => [k, String(v)]),
  );

  // Même validation que l'API : erreurs affichées immédiatement, sans aller-retour.
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Merci de corriger les champs signalés.',
      errors: toFieldErrors(parsed.error),
      values: raw,
    };
  }

  // L'adresse du visiteur est transmise à l'API pour la limitation de débit.
  const forwardedFor = (await headers()).get('x-forwarded-for') ?? '';

  try {
    const res = await fetch(`${API_URL}/api/v1/public/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(forwardedFor && { 'x-forwarded-for': forwardedFor }) },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });
    if (res.status === 429) {
      return {
        status: 'error',
        message: 'Trop de demandes envoyées depuis votre connexion. Merci de réessayer dans une heure.',
        values: raw,
      };
    }
    if (res.status === 400) {
      const body = (await res.json()) as { errors?: FieldErrors };
      return { status: 'error', message: 'Merci de corriger les champs signalés.', errors: body.errors, values: raw };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { status: 'success', message: successMessage };
  } catch (error) {
    console.error(`Échec de l'envoi vers ${path} :`, error);
    return { status: 'error', message: GENERIC_ERROR, values: raw };
  }
}

export async function submitJoinRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  return submit(
    formData,
    joinRequestSchema,
    'join-requests',
    'Merci ! Votre demande a bien été envoyée. Un référent de votre branche vous répondra par e-mail.',
  );
}

export async function submitContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  return submit(
    formData,
    contactMessageSchema,
    'contact',
    'Merci, votre message a bien été envoyé au comité de la famille.',
  );
}
