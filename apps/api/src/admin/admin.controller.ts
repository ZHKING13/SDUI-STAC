import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ROLES,
  groupCreateSchema,
  invitationCreateSchema,
  joinRequestDecisionSchema,
  membershipSchema,
} from '@famille/shared';
import { z } from 'zod';
import { CurrentMember, Roles } from '../auth/auth.decorators';
import { SessionGuard, type CurrentSession } from '../auth/session.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminService } from './admin.service';

const roleSchema = z.object({ role: z.enum(ROLES) });
const statusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']).catch('PENDING');

/** Gestion des entrées dans la famille : administrateurs et référents de branche. */
@Controller('admin')
@UseGuards(SessionGuard)
@Roles('ADMIN', 'MODERATOR')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('join-requests')
  listJoinRequests(@Query('status') status?: string) {
    return this.admin.listJoinRequests(statusSchema.parse(status));
  }

  @Post('join-requests/:id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentMember() session: CurrentSession,
    @Body(new ZodValidationPipe(joinRequestDecisionSchema)) body: z.output<typeof joinRequestDecisionSchema>,
  ) {
    return this.admin.approveJoinRequest(id, session.memberId, body.groupIds);
  }

  @Post('join-requests/:id/reject')
  @HttpCode(204)
  async reject(@Param('id', ParseUUIDPipe) id: string, @CurrentMember() session: CurrentSession) {
    await this.admin.rejectJoinRequest(id, session.memberId);
  }

  @Get('invitations')
  listInvitations() {
    return this.admin.listInvitations();
  }

  @Post('invitations')
  createInvitation(
    @CurrentMember() session: CurrentSession,
    @Body(new ZodValidationPipe(invitationCreateSchema)) body: z.output<typeof invitationCreateSchema>,
  ) {
    return this.admin.createInvitation(session.memberId, body);
  }
}

/** Groupes, rôles et pages de la vitrine : administrateurs uniquement. */
@Controller('admin')
@UseGuards(SessionGuard)
@Roles('ADMIN')
export class AdminOnlyController {
  constructor(private readonly admin: AdminService) {}

  @Post('groups')
  createGroup(@Body(new ZodValidationPipe(groupCreateSchema)) body: z.output<typeof groupCreateSchema>) {
    return this.admin.createGroup(body);
  }

  @Delete('groups/:id')
  @HttpCode(204)
  async deleteGroup(@Param('id', ParseUUIDPipe) id: string) {
    await this.admin.deleteGroup(id);
  }

  @Put('groups/:id/members')
  @HttpCode(204)
  async addMembership(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body(new ZodValidationPipe(membershipSchema)) body: z.output<typeof membershipSchema>,
  ) {
    await this.admin.addMembership(groupId, body.memberId, body.isManager);
  }

  @Delete('groups/:id/members/:memberId')
  @HttpCode(204)
  async removeMembership(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    await this.admin.removeMembership(groupId, memberId);
  }

  @Patch('members/:id/role')
  @HttpCode(204)
  async setRole(
    @Param('id', ParseUUIDPipe) memberId: string,
    @CurrentMember() session: CurrentSession,
    @Body(new ZodValidationPipe(roleSchema)) body: z.output<typeof roleSchema>,
  ) {
    await this.admin.setRole(session.memberId, memberId, body.role);
  }

  @Put('pages/:slug')
  @HttpCode(204)
  async updatePage(@Param('slug') slug: string, @CurrentMember() session: CurrentSession, @Body() body: { content?: unknown }) {
    await this.admin.updatePublicPage(slug, body?.content, session.memberId);
  }
}

/** Liste des groupes, utile à tous les membres (filtre de l'annuaire). */
@Controller('groups')
@UseGuards(SessionGuard)
export class GroupsController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  list() {
    return this.admin.listGroups();
  }
}
