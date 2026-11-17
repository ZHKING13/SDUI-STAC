import { Body, Controller, Get, Header, HttpCode, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ContactMessageData,
  JoinRequestData,
  contactMessageSchema,
  joinRequestSchema,
} from '@famille/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PublicSiteService } from './public-site.service';

/** Limite des formulaires publics : 5 envois par heure et par adresse IP. */
export const FORM_THROTTLE = { default: { limit: 5, ttl: 60 * 60 * 1000 } };

const RECEIVED = { received: true } as const;

@Controller('public')
export class PublicSiteController {
  constructor(private readonly publicSite: PublicSiteService) {}

  @Get('pages/:slug')
  @Header('Cache-Control', 'public, max-age=60')
  getPage(@Param('slug') slug: string) {
    return this.publicSite.getPage(slug);
  }

  // La réponse est identique quand un robot est détecté, pour ne pas l'aider à contourner le piège.
  @Post('join-requests')
  @HttpCode(201)
  @Throttle(FORM_THROTTLE)
  async createJoinRequest(@Body(new ZodValidationPipe(joinRequestSchema)) body: JoinRequestData) {
    await this.publicSite.createJoinRequest(body);
    return RECEIVED;
  }

  @Post('contact')
  @HttpCode(201)
  @Throttle(FORM_THROTTLE)
  async createContactMessage(@Body(new ZodValidationPipe(contactMessageSchema)) body: ContactMessageData) {
    await this.publicSite.createContactMessage(body);
    return RECEIVED;
  }
}
