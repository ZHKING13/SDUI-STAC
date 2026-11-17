import { Module } from '@nestjs/common';
import { AdminController, AdminOnlyController, GroupsController } from './admin.controller';
import { AdminService } from './admin.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [AdminController, AdminOnlyController, GroupsController, InvitationsController],
  providers: [AdminService, InvitationsService],
})
export class AdminModule {}
