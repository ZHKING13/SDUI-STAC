import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import {
  LOGIN_LINK_TTL_MINUTES,
  SESSION_TTL_DAYS,
  type SessionDto,
} from '@famille/shared';
import { hash, verify } from 'argon2';
import { addDays, addMinutes, generateToken, hashToken } from '../common/tokens';
import { MailService } from '../mail/mail.service';
import { loginLinkMail } from '../mail/templates';
import { PrismaService } from '../prisma/prisma.service';
import { toMeDto, meInclude } from '../members/member.mapper';
import type { CurrentSession } from './session.guard';

const INVALID_CREDENTIALS = 'E-mail ou mot de passe incorrect.';
const INVALID_LINK = 'Ce lien de connexion est invalide ou a expiré. Demandez-en un nouveau.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Condensat factice : la vérification prend le même temps, que le compte existe ou non. */
  private readonly dummyHash = hash('mot-de-passe-factice-pour-egaliser-les-temps');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  hashPassword(password: string) {
    return hash(password);
  }

  async login(email: string, password: string, userAgent?: string): Promise<SessionDto> {
    const member = await this.prisma.member.findUnique({ where: { email } });
    const passwordHash = member?.status === 'ACTIVE' ? member.passwordHash : null;
    const ok = await verify(passwordHash ?? (await this.dummyHash), password).catch(() => false);
    if (!member || !passwordHash || !ok) throw new UnauthorizedException(INVALID_CREDENTIALS);
    return this.openSession(member.id, userAgent);
  }

  /**
   * Envoie un lien de connexion si le compte existe et est actif. La réponse est la même dans tous
   * les cas, pour ne pas révéler quelles adresses sont inscrites.
   */
  async requestLoginLink(email: string): Promise<void> {
    const member = await this.prisma.member.findUnique({ where: { email } });
    if (!member || member.status !== 'ACTIVE') return;
    const token = await this.createLoginToken(member.id, LOGIN_LINK_TTL_MINUTES);
    await this.mail.send(loginLinkMail(member.email, member.firstName, token, LOGIN_LINK_TTL_MINUTES));
  }

  /** Crée un lien de connexion à usage unique ; renvoie le jeton en clair (à envoyer par e-mail). */
  async createLoginToken(memberId: string, ttlMinutes: number): Promise<string> {
    const token = generateToken();
    await this.prisma.loginToken.create({
      data: { tokenHash: hashToken(token), memberId, expiresAt: addMinutes(new Date(), ttlMinutes) },
    });
    return token;
  }

  async consumeLoginLink(token: string, userAgent?: string): Promise<SessionDto> {
    const now = new Date();
    // updateMany avec condition : un lien ne peut être utilisé qu'une fois, même en cas de double clic.
    const record = await this.prisma.loginToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record) throw new UnauthorizedException(INVALID_LINK);
    const consumed = await this.prisma.loginToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) throw new UnauthorizedException(INVALID_LINK);
    const member = await this.prisma.member.findUnique({ where: { id: record.memberId } });
    if (!member || member.status !== 'ACTIVE') throw new UnauthorizedException(INVALID_LINK);
    return this.openSession(member.id, userAgent);
  }

  async openSession(memberId: string, userAgent?: string): Promise<SessionDto> {
    const token = generateToken();
    const expiresAt = addDays(new Date(), SESSION_TTL_DAYS);
    await this.prisma.session.create({
      data: { tokenHash: hashToken(token), memberId, expiresAt, userAgent: userAgent?.slice(0, 300) },
    });
    const member = await this.prisma.member.update({
      where: { id: memberId },
      data: { lastLoginAt: new Date() },
      include: meInclude,
    });
    this.logger.log(`Connexion du membre ${memberId}.`);
    return { token, expiresAt: expiresAt.toISOString(), member: toMeDto(member) };
  }

  async validateSession(token: string): Promise<CurrentSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { member: { select: { id: true, role: true, status: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.member.status !== 'ACTIVE') {
      return null;
    }
    return { sessionId: session.id, memberId: session.member.id, role: session.member.role };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  /** Ferme toutes les sessions d'un membre sauf, éventuellement, celle en cours. */
  async revokeOtherSessions(memberId: string, keepSessionId?: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { memberId, revokedAt: null, ...(keepSessionId && { id: { not: keepSessionId } }) },
      data: { revokedAt: new Date() },
    });
  }
}
