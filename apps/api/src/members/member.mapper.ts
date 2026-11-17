import type { DirectoryEntryDto, GroupType, MeDto } from '@famille/shared';
import type { Prisma } from '@prisma/client';

export const meInclude = {
  memberships: { include: { group: { select: { id: true, name: true, type: true } } } },
} satisfies Prisma.MemberInclude;

export type MemberWithGroups = Prisma.MemberGetPayload<{ include: typeof meInclude }>;

export function toMeDto(m: MemberWithGroups): MeDto {
  return {
    id: m.id,
    email: m.email,
    firstName: m.firstName,
    lastName: m.lastName,
    birthName: m.birthName,
    country: m.country,
    city: m.city,
    phone: m.phone,
    phoneVisibility: m.phoneVisibility,
    emailVisibility: m.emailVisibility,
    role: m.role,
    hasPassword: m.passwordHash !== null,
    groups: m.memberships.map((ms) => ({
      id: ms.group.id,
      name: ms.group.name,
      type: ms.group.type as GroupType,
      isManager: ms.isManager,
    })),
  };
}

/** Fiche d'annuaire : une coordonnée privée n'est jamais envoyée, sauf aux administrateurs. */
export function toDirectoryEntry(m: MemberWithGroups, viewerIsAdmin: boolean): DirectoryEntryDto {
  const visible = (v: 'FAMILY' | 'PRIVATE') => viewerIsAdmin || v === 'FAMILY';
  return {
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    birthName: m.birthName,
    country: m.country,
    city: m.city,
    email: visible(m.emailVisibility) ? m.email : null,
    phone: visible(m.phoneVisibility) ? m.phone : null,
    groups: m.memberships.map((ms) => ({ id: ms.group.id, name: ms.group.name, type: ms.group.type as GroupType })),
  };
}
