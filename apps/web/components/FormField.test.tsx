import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FormField, Honeypot } from './FormField';

afterEach(cleanup);

describe('FormField', () => {
  it('relie le libellé, l’aide et l’erreur au champ', () => {
    render(
      <FormField
        name="email"
        label="E-mail"
        type="email"
        hint="Nous ne la publierons jamais."
        errors={{ email: "L'adresse e-mail n'est pas valide." }}
      />,
    );
    const input = screen.getByLabelText('E-mail');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('field-email-hint field-email-error');
    expect(screen.getByText("L'adresse e-mail n'est pas valide.").id).toBe('field-email-error');
  });

  it('signale un champ facultatif et ne le marque pas invalide sans erreur', () => {
    render(<FormField name="message" label="Un mot" multiline required={false} />);
    const textarea = screen.getByLabelText(/Un mot/);
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.hasAttribute('required')).toBe(false);
    expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    expect(screen.getByText('(facultatif)')).toBeTruthy();
  });

  it('cache le champ piège aux humains et aux lecteurs d’écran', () => {
    const { container } = render(<Honeypot />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper.querySelector('input')?.tabIndex).toBe(-1);
  });
});
