import { ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';
import type { Role } from '@famille/shared';
import type { AuthenticatedRequest, CurrentSession } from './session.guard';

export const ROLES_KEY = 'roles';

/** Réserve une route à certains rôles (en plus d'une session valide). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Membre connecté, déposé sur la requête par SessionGuard. */
export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentSession => ctx.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
