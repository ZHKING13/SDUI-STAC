import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { invitationAcceptSchema } from '@famille/shared';
import type { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { InvitationsService } from './invitations.service';

const THROTTLE = { default: { limit: 20, ttl: 15 * 60 * 1000 } };

/** Routes publiques : la personne invitée n'a pas encore de compte. */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get(':token')
  @Throttle(THROTTLE)
  preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  @Post('accept')
  @Throttle(THROTTLE)
  accept(
    @Body(new ZodValidationPipe(invitationAcceptSchema)) body: z.output<typeof invitationAcceptSchema>,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.invitations.accept(body, userAgent);
  }
}
