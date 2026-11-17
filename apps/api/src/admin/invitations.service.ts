import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { InvitationPreviewDto, SessionDto } from '@famille/shared';
import { AuthService } from '../auth/auth.service';
import { hashToken } from '../common/tokens';
import { PrismaService } from '../prisma/prisma.service';

const INVALID = 'Cette invitation est invalide, déjà utilisée ou expirée.';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private async findUsable(token: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
      throw new NotFoundException(INVALID);
    }
    return invitation;
  }

  async preview(token: string): Promise<InvitationPreviewDto> {
    const { email, firstName, lastName } = await this.findUsable(token);
    return { email, firstName, lastName };
  }

  async accept(
    data: { token: string; firstName: string; lastName: string; password: string },
    userAgent?: string,
  ): Promise<SessionDto> {
    const invitation = await this.findUsable(data.token);
    if (await this.prisma.member.findUnique({ where: { email: invitation.email } })) {
      throw new ConflictException('Un compte existe déjà avec cet e-mail. Connectez-vous depuis la page de connexion.');
    }
    const passwordHash = await this.auth.hashPassword(data.password);
    const existingGroups = await this.prisma.group.findMany({
      where: { id: { in: invitation.groupIds } },
      select: { id: true },
    });

    const member = await this.prisma.$transaction(async (tx) => {
      // La condition sur acceptedAt empêche d'utiliser deux fois la même invitation en parallèle.
      const marked = await tx.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (marked.count !== 1) throw new NotFoundException(INVALID);
      return tx.member.create({
        data: {
          email: invitation.email,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
          memberships: { create: existingGroups.map((g) => ({ groupId: g.id })) },
        },
      });
    });
    return this.auth.openSession(member.id, userAgent);
  }
}
