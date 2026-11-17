'use server';

import { revalidatePath } from 'next/cache';
import {
  groupCreateSchema,
  invitationCreateSchema,
  passwordChangeSchema,
  profileUpdateSchema,
} from '@famille/shared';
import { parseForm, type FormState } from '@/lib/form-state';
import { ApiError, apiFetch } from '@/lib/session';

function failure(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof ApiError) return { status: 'error', message: error.message, errors: error.errors, values };
  console.error(error);
  return { status: 'error', message: 'Le service est momentanément indisponible. Merci de réessayer.', values };
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const form = parseForm(formData, profileUpdateSchema);
  if (!form.ok) return form.state;
  try {
    await apiFetch('/me', { method: 'PATCH', body: form.data });
  } catch (error) {
    return failure(error, form.values);
  }
  revalidatePath('/espace-famille', 'layout');
  return { status: 'success', message: 'Votre profil est enregistré.', values: form.values };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const form = parseForm(formData, passwordChangeSchema);
  if (!form.ok) return form.state;
  try {
    await apiFetch('/me/password', { body: form.data });
  } catch (error) {
    return failure(error);
  }
  return {
    status: 'success',
    message: 'Mot de passe enregistré. Vos autres appareils devront se reconnecter.',
  };
}

export async function decideJoinRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const decision = formData.get('decision');
  if (decision !== 'approve' && decision !== 'reject') {
    return { status: 'error', message: 'Choisissez « Accepter » ou « Refuser ».' };
  }
  try {
    if (decision === 'approve') {
      await apiFetch(`/admin/join-requests/${id}/approve`, { body: { groupIds: formData.getAll('groupIds').map(String) } });
    } else {
      await apiFetch(`/admin/join-requests/${id}/reject`, { method: 'POST' });
    }
  } catch (error) {
    return failure(error);
  }
  // Pas de rafraîchissement ici : la carte affiche sa confirmation, la liste se met à jour à la visite suivante.
  return {
    status: 'success',
    message: decision === 'approve' ? 'Demande acceptée : un e-mail de bienvenue a été envoyé.' : 'Demande refusée.',
  };
}

export async function inviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const form = parseForm(formData, invitationCreateSchema, { groupIds: formData.getAll('groupIds').map(String) });
  if (!form.ok) return form.state;
  try {
    await apiFetch('/admin/invitations', { body: form.data });
  } catch (error) {
    return failure(error, form.values);
  }
  revalidatePath('/espace-famille/admin');
  return { status: 'success', message: `Invitation envoyée à ${form.data.email}.` };
}

export async function createGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const form = parseForm(formData, groupCreateSchema);
  if (!form.ok) return form.state;
  try {
    await apiFetch('/admin/groups', { body: form.data });
  } catch (error) {
    return failure(error, form.values);
  }
  revalidatePath('/espace-famille', 'layout');
  return { status: 'success', message: `Groupe « ${form.data.name} » créé.` };
}
