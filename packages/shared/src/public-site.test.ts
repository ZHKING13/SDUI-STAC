import { describe, expect, it } from 'vitest';
import {
  contactMessageSchema,
  defaultHomeContent,
  defaultLegalNotice,
  defaultPrivacyPolicy,
  homeContentSchema,
  joinRequestSchema,
  legalPageContentSchema,
  toFieldErrors,
} from './index';

describe('contenu par défaut', () => {
  it('respecte les schémas de la vitrine', () => {
    expect(homeContentSchema.safeParse(defaultHomeContent).success).toBe(true);
    expect(legalPageContentSchema.safeParse(defaultLegalNotice).success).toBe(true);
    expect(legalPageContentSchema.safeParse(defaultPrivacyPolicy).success).toBe(true);
  });
});

describe("demande d'adhésion", () => {
  const valid = {
    fullName: '  Awa Wodie ',
    email: 'Awa@Example.COM',
    relationship: 'Fille de Paul, petite-fille d’Hélène',
  };

  it('normalise une demande valide', () => {
    const parsed = joinRequestSchema.parse(valid);
    expect(parsed.fullName).toBe('Awa Wodie');
    expect(parsed.email).toBe('awa@example.com');
    expect(parsed.message).toBe('');
    expect(parsed.website).toBe('');
  });

  it('refuse un e-mail invalide avec un message en français', () => {
    const result = joinRequestSchema.safeParse({ ...valid, email: 'pas-un-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error)).toEqual({ email: "L'adresse e-mail n'est pas valide." });
    }
  });

  it('exige un lien avec la famille suffisamment précis', () => {
    const result = joinRequestSchema.safeParse({ ...valid, relationship: 'oui' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).relationship).toMatch(/au moins 5 caractères/);
    }
  });

  it('dit « obligatoire » pour un champ laissé vide', () => {
    const result = joinRequestSchema.safeParse({ ...valid, relationship: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).relationship).toBe('Le lien avec la famille est obligatoire.');
    }
  });

  it('signale les champs manquants', () => {
    const result = joinRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(toFieldErrors(result.error)).sort()).toEqual(['email', 'fullName', 'relationship']);
    }
  });
});

describe('message de contact', () => {
  it('refuse un message trop court', () => {
    const result = contactMessageSchema.safeParse({ name: 'Jean', email: 'jean@example.com', message: 'Salut' });
    expect(result.success).toBe(false);
  });
});
