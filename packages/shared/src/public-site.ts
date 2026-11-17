import { z } from 'zod';

/**
 * Contenu de la vitrine publique, stocké en JSON dans la table PublicPage
 * et modifiable plus tard par les administrateurs (exigence PUB-09).
 */

const image = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
});

export const homeContentSchema = z.object({
  familyName: z.string().min(1),
  tagline: z.string(),
  hero: z.object({
    kicker: z.string(),
    title: z.string().min(1),
    intro: z.string(),
    image: image.optional(),
    imagePlaceholder: z.string(),
    caption: z.string().optional(),
  }),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).max(6),
  history: z.object({
    kicker: z.string(),
    title: z.string(),
    paragraphs: z.array(z.string()).min(1),
    quote: z.string().optional(),
    timeline: z.array(z.object({ year: z.string(), text: z.string() })),
  }),
  roots: z.object({
    kicker: z.string(),
    title: z.string(),
    text: z.string(),
    note: z.string(),
    mapImage: image.optional(),
    mapPlaceholder: z.string(),
  }),
  together: z.object({
    kicker: z.string(),
    title: z.string(),
    items: z.array(z.object({ title: z.string(), text: z.string() })).max(6),
  }),
  nextEvent: z
    .object({
      kicker: z.string(),
      title: z.string(),
      text: z.string(),
    })
    .optional(),
  join: z.object({
    kicker: z.string(),
    title: z.string(),
    text: z.string(),
  }),
});

export type HomeContent = z.infer<typeof homeContentSchema>;

export const legalPageContentSchema = z.object({
  title: z.string().min(1),
  sections: z.array(z.object({ heading: z.string(), body: z.array(z.string()) })),
});

export type LegalPageContent = z.infer<typeof legalPageContentSchema>;

export const PUBLIC_PAGE_SLUGS = ['accueil', 'mentions-legales', 'confidentialite'] as const;
export type PublicPageSlug = (typeof PUBLIC_PAGE_SLUGS)[number];

export interface PublicPageDto<T = unknown> {
  slug: string;
  title: string;
  content: T;
  updatedAt: string;
}

/* ---------- Formulaires publics ---------- */

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} est obligatoire.` })
    .trim()
    .min(1, `${label} est obligatoire.`)
    .min(min, `${label} doit contenir au moins ${min} caractères.`)
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`);

const email = z
  .string({ required_error: "L'e-mail est obligatoire." })
  .trim()
  .toLowerCase()
  .min(1, "L'e-mail est obligatoire.")
  .email("L'adresse e-mail n'est pas valide.")
  .max(254);

/**
 * Champ piège : invisible pour les humains, rempli par les robots.
 * Une demande qui le remplit est acceptée en apparence mais jamais enregistrée.
 */
const honeypot = z.string().max(200).optional().default('');

export const joinRequestSchema = z.object({
  fullName: trimmed(2, 120, 'Le nom'),
  email,
  relationship: trimmed(5, 500, 'Le lien avec la famille'),
  message: z.string().trim().max(2000).optional().default(''),
  website: honeypot,
});

export type JoinRequestInput = z.input<typeof joinRequestSchema>;
export type JoinRequestData = z.output<typeof joinRequestSchema>;

export const contactMessageSchema = z.object({
  name: trimmed(2, 120, 'Le nom'),
  email,
  message: trimmed(10, 4000, 'Le message'),
  website: honeypot,
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactMessageData = z.output<typeof contactMessageSchema>;

/** Erreurs de validation renvoyées par l'API, indexées par champ. */
export type FieldErrors = Partial<Record<string, string>>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
