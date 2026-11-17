import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { loginLinkRequestSchema, loginSchema, tokenSchema } from '@famille/shared';
import type { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { CurrentMember } from './auth.decorators';
import { SessionGuard, type CurrentSession } from './session.guard';

/** 10 tentatives de connexion par quart d'heure et par adresse IP. */
const LOGIN_THROTTLE = { default: { limit: 10, ttl: 15 * 60 * 1000 } };
const LINK_THROTTLE = { default: { limit: 5, ttl: 60 * 60 * 1000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle(LOGIN_THROTTLE)
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: z.output<typeof loginSchema>,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.auth.login(body.email, body.password, userAgent);
  }

  @Post('login-link')
  @HttpCode(202)
  @Throttle(LINK_THROTTLE)
  async requestLoginLink(@Body(new ZodValidationPipe(loginLinkRequestSchema)) body: z.output<typeof loginLinkRequestSchema>) {
    await this.auth.requestLoginLink(body.email);
    return { sent: true };
  }

  @Post('login-link/verify')
  @HttpCode(200)
  @Throttle(LOGIN_THROTTLE)
  verifyLoginLink(
    @Body(new ZodValidationPipe(tokenSchema)) body: z.output<typeof tokenSchema>,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.auth.consumeLoginLink(body.token, userAgent);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  async logout(@CurrentMember() session: CurrentSession) {
    await this.auth.logout(session.sessionId);
  }
}
