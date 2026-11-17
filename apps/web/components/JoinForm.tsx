'use client';

import { useActionState } from 'react';
import { submitJoinRequest, type FormState } from '@/app/actions';
import { FormField, Honeypot } from './FormField';
import { FormStatus } from './FormStatus';

const initialState: FormState = { status: 'idle' };

export function JoinForm() {
  const [state, action, pending] = useActionState(submitJoinRequest, initialState);

  if (state.status === 'success') return <FormStatus state={state} />;

  const v = state.values ?? {};
  return (
    <form action={action} className="form form--dark" noValidate>
      <div className="form__row">
        <FormField name="fullName" label="Prénom et nom" errors={state.errors} defaultValue={v.fullName} autoComplete="name" />
        <FormField name="email" label="E-mail" type="email" errors={state.errors} defaultValue={v.email} autoComplete="email" />
      </div>
      <FormField
        name="relationship"
        label="Votre lien avec la famille"
        errors={state.errors}
        defaultValue={v.relationship}
        hint="Par exemple : « fille de Paul Wodie, petite-fille d’Hélène »"
      />
      <FormField name="message" label="Un mot pour le comité" multiline required={false} errors={state.errors} defaultValue={v.message} />
      <Honeypot />
      <FormStatus state={state} />
      <button type="submit" className="button button--light" disabled={pending}>
        {pending ? 'Envoi en cours…' : 'Envoyer ma demande'}
      </button>
    </form>
  );
}
