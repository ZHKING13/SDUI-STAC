'use client';

import { useActionState } from 'react';
import { submitContactMessage, type FormState } from '@/app/actions';
import { FormField, Honeypot } from './FormField';
import { FormStatus } from './FormStatus';

const initialState: FormState = { status: 'idle' };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactMessage, initialState);

  if (state.status === 'success') return <FormStatus state={state} />;

  const v = state.values ?? {};
  return (
    <form action={action} className="form" noValidate>
      <div className="form__row">
        <FormField name="name" label="Votre nom" errors={state.errors} defaultValue={v.name} autoComplete="name" />
        <FormField name="email" label="E-mail" type="email" errors={state.errors} defaultValue={v.email} autoComplete="email" />
      </div>
      <FormField name="message" label="Votre message" multiline errors={state.errors} defaultValue={v.message} />
      <Honeypot />
      <FormStatus state={state} />
      <button type="submit" className="button button--primary" disabled={pending}>
        {pending ? 'Envoi en cours…' : 'Envoyer'}
      </button>
    </form>
  );
}
