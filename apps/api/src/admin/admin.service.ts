import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  INVITATION_TTL_DAYS,
  homeContentSchema,
  legalPageContentSchema,
  type GroupDto,
  type GroupType,
  type InvitationDto,
  type JoinRequestDto,
  type Role,
} from '@famille/shared';
import { AuthService } from '../auth/auth.service';
import { addDays, generateToken, hashToken } from '../common/tokens';
import { MailService } from '../mail/mail.service';
import { invitationMail, welcomeMail } from '../mail/templates';
import { PrismaService } from '../prisma/prisma.service';

/** Le lien de bienvenue reste valable une semaine : le nouveau membre ne le lit pas forcément tout de suite. */
const WELCOME_LINK_TTL_MINUTES = 7 * 24 * 60;

const pageSchemas = {
  accueil: homeContentSchema,
  'mentions-legales': legalPageContentSchema,
  confidentialite: legalPageContentSchema,
} as const;

/** Sépare « Awa Marie Wodie » en prénom « Awa Marie » et nom « Wodie ». */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}

  /* ---------- Demandes d'adhésion ---------- */

  async listJoinRequests(status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<JoinRequestDto[]> {
    const requests = await this.prisma.joinRequest.findMany({ where: { status }, orderBy: { createdAt: 'asc' } });
    return requests.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  async approveJoinRequest(id: string, reviewerId: string, groupIds: string[]): Promise<{ memberId: string }> {
    const request = await this.prisma.joinRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable.');
    if (request.status !== 'PENDING') throw new ConflictException('Cette demande a déjà été traitée.');
    await this.assertGroupsExist(groupIds);
    if (await this.prisma.member.findUnique({ where: { email: request.email } })) {
      throw new ConflictException('Un compte existe déjà avec cet e-mail.');
    }

    const { firstName, lastName } = splitFullName(request.fullName);
    const member = await this.prisma.$transaction(async (tx) => {
      const created = await tx.member.create({
        data: {
          email: request.email,
          firstName,
          lastName,
          memberships: { create: groupIds.map((groupId) => ({ groupId })) },
        },
      });
      await tx.joinRequest.update({
        where: { id },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: reviewerId },
      });
      return created;
    });

    const token = await this.auth.createLoginToken(member.id, WELCOME_LINK_TTL_MINUTES);
    await this.mail.send(welcomeMail(member.email, member.firstName, token));
    this.logger.log(`Demande ${id} acceptée par ${reviewerId} : membre ${member.id} créé.`);
    return { memberId: member.id };
  }

  async rejectJoinRequest(id: string, reviewerId: string): Promise<void> {
    const updated = await this.prisma.joinRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'REJECTED', reviewedAt: new Date(), reviewedById: reviewerId },
    });
    if (updated.count !== 1) throw new NotFoundException('Demande introuvable ou déjà traitée.');
  }

  /* ---------- Invitations ---------- */

  async createInvitation(
    inviterId: string,
    data: { email: string; firstName: string; lastName: string; groupIds: string[] },
  ): Promise<InvitationDto> {
    await this.assertGroupsExist(data.groupIds);
    if (await this.prisma.member.findUnique({ where: { email: data.email } })) {
      throw new ConflictException('Un compte existe déjà avec cet e-mail.');
    }
    const inviter = await this.prisma.member.findUniqueOrThrow({ where: { id: inviterId } });
    const token = generateToken();
    const invitation = await this.prisma.invitation.create({
      data: {
        ...data,
        tokenHash: hashToken(token),
        invitedById: inviterId,
        expiresAt: addDays(new Date(), INVITATION_TTL_DAYS),
      },
    });
    await this.mail.send(
      invitationMail(data.email, data.firstName, `${inviter.firstName} ${inviter.lastName}`, token, INVITATION_TTL_DAYS),
    );
    return this.toInvitationDto(invitation);
  }

  async listInvitations(): Promise<InvitationDto[]> {
    const invitations = await this.prisma.invitation.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return invitations.map((i) => this.toInvitationDto(i));
  }

  private toInvitationDto(i: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
  }): InvitationDto {
    return {
      id: i.id,
      email: i.email,
      firstName: i.firstName,
      lastName: i.lastName,
      expiresAt: i.expiresAt.toISOString(),
      acceptedAt: i.acceptedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
    };
  }

  /* ---------- Groupes ---------- */

  async listGroups(): Promise<GroupDto[]> {
    const groups = await this.prisma.group.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { memberships: true } } },
    });
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type as GroupType,
      description: g.description,
      memberCount: g._count.memberships,
    }));
  }

  async createGroup(data: { name: string; type: GroupType; description: string }): Promise<GroupDto> {
    if (await this.prisma.group.findUnique({ where: { name: data.name } })) {
      throw new ConflictException('Un groupe porte déjà ce nom.');
    }
    const group = await this.prisma.group.create({ data });
    return { id: group.id, name: group.name, type: group.type as GroupType, description: group.description, memberCount: 0 };
  }

  async deleteGroup(id: string): Promise<void> {
    await this.prisma.group.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Groupe introuvable.');
    });
  }

  async addMembership(groupId: string, memberId: string, isManager: boolean): Promise<void> {
    await this.assertGroupsExist([groupId]);
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Membre introuvable.');
    await this.prisma.membership.upsert({
      where: { memberId_groupId: { memberId, groupId } },
      create: { memberId, groupId, isManager },
      update: { isManager },
    });
  }

  async removeMembership(groupId: string, memberId: string): Promise<void> {
    await this.prisma.membership.deleteMany({ where: { groupId, memberId } });
  }

  /* ---------- Rôles ---------- */

  async setRole(actorId: string, memberId: string, role: Role): Promise<void> {
    if (actorId === memberId) throw new ForbiddenException('Vous ne pouvez pas modifier votre propre rôle.');
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Membre introuvable.');
    await this.prisma.member.update({ where: { id: memberId }, data: { role } });
    this.logger.log(`Rôle du membre ${memberId} changé en ${role} par ${actorId}.`);
  }

  /* ---------- Pages de la vitrine (PUB-09) ---------- */

  async updatePublicPage(slug: string, content: unknown, actorId: string): Promise<void> {
    const schema = pageSchemas[slug as keyof typeof pageSchemas];
    if (!schema) throw new NotFoundException('Page introuvable.');
    const parsed = schema.safeParse(content);
    if (!parsed.success) {
      throw new BadRequestException({ statusCode: 400, message: 'Contenu invalide.', issues: parsed.error.issues });
    }
    const title = 'familyName' in parsed.data ? parsed.data.familyName : parsed.data.title;
    await this.prisma.publicPage.upsert({
      where: { slug },
      create: { slug, title, content: parsed.data },
      update: { title, content: parsed.data },
    });
    this.logger.log(`Page publique « ${slug} » modifiée par ${actorId}.`);
  }

  private async assertGroupsExist(groupIds: string[]): Promise<void> {
    if (groupIds.length === 0) return;
    const count = await this.prisma.group.count({ where: { id: { in: groupIds } } });
    if (count !== new Set(groupIds).size) throw new BadRequestException('Un des groupes choisis n’existe pas.');
  }
}
