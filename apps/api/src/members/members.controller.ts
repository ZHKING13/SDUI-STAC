import { Body, Controller, Get, HttpCode, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { passwordChangeSchema, profileUpdateSchema } from '@famille/shared';
import type { z } from 'zod';
import { CurrentMember } from '../auth/auth.decorators';
import { SessionGuard, type CurrentSession } from '../auth/session.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MembersService } from './members.service';

@Controller()
@UseGuards(SessionGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get('me')
  me(@CurrentMember() session: CurrentSession) {
    return this.members.me(session.memberId);
  }

  @Patch('me')
  updateProfile(
    @CurrentMember() session: CurrentSession,
    @Body(new ZodValidationPipe(profileUpdateSchema)) body: z.output<typeof profileUpdateSchema>,
  ) {
    return this.members.updateProfile(session.memberId, body);
  }

  @Post('me/password')
  @HttpCode(204)
  async changePassword(
    @CurrentMember() session: CurrentSession,
    @Body(new ZodValidationPipe(passwordChangeSchema)) body: z.output<typeof passwordChangeSchema>,
  ) {
    await this.members.changePassword(session.memberId, session.sessionId, body.currentPassword, body.newPassword);
  }

  @Get('members')
  directory(
    @CurrentMember() session: CurrentSession,
    @Query('q') q = '',
    @Query('group') group?: string,
  ) {
    return this.members.directory(String(q).slice(0, 80), group || undefined, session.role === 'ADMIN');
  }
}
