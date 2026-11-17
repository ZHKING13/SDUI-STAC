import { z } from 'zod';

/* ---------- Valeurs partagées ---------- */

export const ROLES = ['MEMBER', 'MODERATOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const GROUP_TYPES = ['BRANCH', 'COMMITTEE', 'LOCATION', 'ADHOC'] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  BRANCH: 'Branche',
  COMMITTEE: 'Comité',
  LOCATION: 'Pays ou ville',
  ADHOC: 'Groupe',
};

export const FIELD_VISIBILITIES = ['FAMILY', 'PRIVATE'] as const;
export type FieldVisibility = (typeof FIELD_VISIBILITIES)[number];

/** Durée de validité des liens envoyés par e-mail. */
export const LOGIN_LINK_TTL_MINUTES = 15;
export const INVITATION_TTL_DAYS = 14;
export const SESSION_TTL_DAYS = 30;

/* ---------- Champs ---------- */

const email = z
  .string({ required_error: "L'e-mail est obligatoire." })
  .trim()
  .toLowerCase()
  .min(1, "L'e-mail est obligatoire.")
  .email("L'adresse e-mail n'est pas valide.")
  .max(254);

const name = (label: string) =>
  z
    .string({ required_error: `${label} est obligatoire.` })
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(80, `${label} ne doit pas dépasser 80 caractères.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

/** 10 caractères minimum : assez long pour être sûr, assez simple pour tous les âges. */
export const passwordSchema = z
  .string({ required_error: 'Le mot de passe est obligatoire.' })
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
  .max(200, 'Le mot de passe est trop long.');

/* ---------- Connexion ---------- */

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Le mot de passe est obligatoire.' }).min(1, 'Le mot de passe est obligatoire.'),
});
export type LoginInput = z.input<typeof loginSchema>;

export const loginLinkRequestSchema = z.object({ email });
export type LoginLinkRequestInput = z.input<typeof loginLinkRequestSchema>;

export const tokenSchema = z.object({ token: z.string().min(20).max(200) });

/* ---------- Profil ---------- */

export const profileUpdateSchema = z.object({
  firstName: name('Le prénom'),
  lastName: name('Le nom'),
  birthName: optionalText(80),
  country: optionalText(80),
  city: optionalText(80),
  phone: optionalText(40),
  phoneVisibility: z.enum(FIELD_VISIBILITIES).default('PRIVATE'),
  emailVisibility: z.enum(FIELD_VISIBILITIES).default('FAMILY'),
});
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().optional().default(''),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les deux mots de passe ne sont pas identiques.',
  });
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;

/* ---------- Invitations et demandes d'adhésion ---------- */

export const invitationCreateSchema = z.object({
  email,
  firstName: name('Le prénom'),
  lastName: name('Le nom'),
  groupIds: z.array(z.string().uuid()).max(20).default([]),
});
export type InvitationCreateInput = z.input<typeof invitationCreateSchema>;

export const invitationAcceptSchema = z
  .object({
    token: z.string().min(20).max(200),
    firstName: name('Le prénom'),
    lastName: name('Le nom'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les deux mots de passe ne sont pas identiques.',
  });
export type InvitationAcceptInput = z.input<typeof invitationAcceptSchema>;

export const joinRequestDecisionSchema = z.object({
  groupIds: z.array(z.string().uuid()).max(20).default([]),
});

/* ---------- Groupes ---------- */

export const groupCreateSchema = z.object({
  name: z.string().trim().min(2, 'Le nom du groupe doit contenir au moins 2 caractères.').max(80),
  type: z.enum(GROUP_TYPES),
  description: z.string().trim().max(500).optional().default(''),
});
export type GroupCreateInput = z.input<typeof groupCreateSchema>;

export const membershipSchema = z.object({
  memberId: z.string().uuid(),
  isManager: z.boolean().optional().default(false),
});

/* ---------- Réponses de l'API ---------- */

export interface GroupSummaryDto {
  id: string;
  name: string;
  type: GroupType;
}

export interface MeDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthName: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  phoneVisibility: FieldVisibility;
  emailVisibility: FieldVisibility;
  role: Role;
  hasPassword: boolean;
  groups: (GroupSummaryDto & { isManager: boolean })[];
}

/** Fiche d'annuaire : les coordonnées privées sont retirées côté serveur. */
export interface DirectoryEntryDto {
  id: string;
  firstName: string;
  lastName: string;
  birthName: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  groups: GroupSummaryDto[];
}

export interface SessionDto {
  token: string;
  expiresAt: string;
  member: MeDto;
}

export interface GroupDto extends GroupSummaryDto {
  description: string;
  memberCount: number;
}

export interface JoinRequestDto {
  id: string;
  fullName: string;
  email: string;
  relationship: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface InvitationDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InvitationPreviewDto {
  email: string;
  firstName: string;
  lastName: string;
}

export const isStaff = (role: Role) => role === 'ADMIN' || role === 'MODERATOR';
