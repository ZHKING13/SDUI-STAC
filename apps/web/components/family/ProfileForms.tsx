'use client';

import { useActionState } from 'react';
import type { MeDto } from '@famille/shared';
import { changePasswordAction, updateProfileAction } from '@/app/espace-famille/actions';
import { initialFormState } from '@/lib/form-state';
import { FormField } from '../FormField';
import { FormStatus } from '../FormStatus';

function VisibilitySelect({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <div className="field">
      <label htmlFor={`field-${name}`} className="field__label">
        {label}
      </label>
      <select id={`field-${name}`} name={name} defaultValue={value} className="field__input">
        <option value="FAMILY">Visible par toute la famille</option>
        <option value="PRIVATE">Visible seulement par les administrateurs</option>
      </select>
    </div>
  );
}

export function ProfileForm({ me }: { me: MeDto }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialFormState);
  const v = state.values ?? {};
  const val = (key: keyof MeDto) => v[key] ?? (me[key] as string | null) ?? '';
  return (
    <form action={action} className="form" noValidate>
      <div className="form__row">
        <FormField name="firstName" label="Prénom" autoComplete="given-name" errors={state.errors} defaultValue={val('firstName')} />
        <FormField name="lastName" label="Nom" autoComplete="family-name" errors={state.errors} defaultValue={val('lastName')} />
      </div>
      <FormField name="birthName" label="Nom de naissance" required={false} errors={state.errors} defaultValue={val('birthName')} />
      <div className="form__row">
        <FormField name="country" label="Pays" required={false} autoComplete="country-name" errors={state.errors} defaultValue={val('country')} />
        <FormField name="city" label="Ville" required={false} autoComplete="address-level2" errors={state.errors} defaultValue={val('city')} />
      </div>
      <FormField name="phone" label="Téléphone" type="tel" required={false} autoComplete="tel" errors={state.errors} defaultValue={val('phone')} />
      <div className="form__row">
        <VisibilitySelect name="emailVisibility" label={`Mon e-mail (${me.email})`} value={val('emailVisibility')} />
        <VisibilitySelect name="phoneVisibility" label="Mon téléphone" value={val('phoneVisibility')} />
      </div>
      <FormStatus state={state} />
      <button type="submit" className="button button--primary" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer mon profil'}
      </button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, initialFormState);
  return (
    <form action={action} className="form" noValidate>
      {hasPassword && (
        <FormField name="currentPassword" label="Mot de passe actuel" type="password" autoComplete="current-password" errors={state.errors} />
      )}
      <FormField
        name="newPassword"
        label={hasPassword ? 'Nouveau mot de passe' : 'Choisissez un mot de passe'}
        type="password"
        autoComplete="new-password"
        hint="10 caractères au moins. Une petite phrase est facile à retenir."
        errors={state.errors}
      />
      <FormField name="confirmPassword" label="Confirmez le mot de passe" type="password" autoComplete="new-password" errors={state.errors} />
      <FormStatus state={state} />
      <button type="submit" className="button button--outline" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </button>
    </form>
  );
}
