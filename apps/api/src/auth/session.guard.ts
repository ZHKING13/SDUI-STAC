import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@famille/shared';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { ROLES_KEY } from './auth.decorators';

export interface CurrentSession {
  sessionId: string;
  memberId: string;
  role: Role;
}

export type AuthenticatedRequest = FastifyRequest & { auth: CurrentSession };

/** Exige un jeton de session valide (en-tête Authorization: Bearer) et, si demandé, un rôle. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const session = token ? await this.auth.validateSession(token) : null;
    if (!session) throw new UnauthorizedException('Session absente ou expirée.');
    request.auth = session;

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(session.role)) {
      throw new ForbiddenException('Accès réservé.');
    }
    return true;
  }
}
