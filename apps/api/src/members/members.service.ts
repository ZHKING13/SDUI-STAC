import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { DirectoryEntryDto, MeDto } from '@famille/shared';
import type { Prisma } from '@prisma/client';
import { verify } from 'argon2';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { meInclude, toDirectoryEntry, toMeDto } from './member.mapper';

export interface ProfileData {
  firstName: string;
  lastName: string;
  birthName: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  phoneVisibility: 'FAMILY' | 'PRIVATE';
  emailVisibility: 'FAMILY' | 'PRIVATE';
}

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async me(memberId: string): Promise<MeDto> {
    const member = await this.prisma.member.findUnique({ where: { id: memberId }, include: meInclude });
    if (!member) throw new NotFoundException();
    return toMeDto(member);
  }

  async updateProfile(memberId: string, data: ProfileData): Promise<MeDto> {
    const member = await this.prisma.member.update({ where: { id: memberId }, data, include: meInclude });
    return toMeDto(member);
  }

  /**
   * Change le mot de passe. Le mot de passe actuel est exigé s'il en existe un ; un membre arrivé par
   * lien de connexion peut en définir un sans. Les autres sessions sont fermées.
   */
  async changePassword(memberId: string, sessionId: string, current: string, next: string): Promise<void> {
    const member = await this.prisma.member.findUniqueOrThrow({ where: { id: memberId } });
    if (member.passwordHash && !(await verify(member.passwordHash, current).catch(() => false))) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Certains champs sont invalides.',
        errors: { currentPassword: 'Le mot de passe actuel est incorrect.' },
      });
    }
    await this.prisma.member.update({
      where: { id: memberId },
      data: { passwordHash: await this.auth.hashPassword(next) },
    });
    await this.auth.revokeOtherSessions(memberId, sessionId);
  }

  async directory(query: string, groupId: string | undefined, viewerIsAdmin: boolean): Promise<DirectoryEntryDto[]> {
    const q = query.trim();
    const where: Prisma.MemberWhereInput = {
      status: 'ACTIVE',
      ...(q && {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { birthName: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { country: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(groupId && { memberships: { some: { groupId } } }),
    };
    const members = await this.prisma.member.findMany({
      where,
      include: meInclude,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 200,
    });
    return members.map((m) => toDirectoryEntry(m, viewerIsAdmin));
  }
}
