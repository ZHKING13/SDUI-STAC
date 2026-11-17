import type { FieldErrors } from '@famille/shared';
import type { ZodTypeAny, output } from 'zod';
import { toFieldErrors } from '@famille/shared';

export interface FormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  errors?: FieldErrors;
  /** Valeurs saisies, renvoyées pour ne pas vider le formulaire en cas d'erreur. */
  values?: Record<string, string>;
}

export const initialFormState: FormState = { status: 'idle' };

/** Lit un formulaire (sans les champs techniques de React) et le valide avec un schéma partagé. */
export function parseForm<S extends ZodTypeAny>(
  formData: FormData,
  schema: S,
  extra: Record<string, unknown> = {},
): { ok: true; data: output<S>; values: Record<string, string> } | { ok: false; state: FormState } {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([key]) => !key.startsWith('$')).map(([k, v]) => [k, String(v)]),
  );
  const parsed = schema.safeParse({ ...values, ...extra });
  if (!parsed.success) {
    return {
      ok: false,
      state: {
        status: 'error',
        message: 'Merci de corriger les champs signalés.',
        errors: toFieldErrors(parsed.error),
        values: Object.fromEntries(Object.entries(values).filter(([k]) => !/password/i.test(k))),
      },
    };
  }
  return { ok: true, data: parsed.data, values };
}
