import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import {
  ContactMessageData,
  JoinRequestData,
  PublicPageDto,
  homeContentSchema,
  legalPageContentSchema,
} from '@famille/shared';
import { PrismaService } from '../prisma/prisma.service';

const contentSchemas = {
  accueil: homeContentSchema,
  'mentions-legales': legalPageContentSchema,
  confidentialite: legalPageContentSchema,
} as const;

type KnownSlug = keyof typeof contentSchemas;

const isKnownSlug = (slug: string): slug is KnownSlug => slug in contentSchemas;

@Injectable()
export class PublicSiteService {
  private readonly logger = new Logger(PublicSiteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPage(slug: string): Promise<PublicPageDto> {
    if (!isKnownSlug(slug)) throw new NotFoundException('Page introuvable.');
    const page = await this.prisma.publicPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundException('Page introuvable.');

    const parsed = contentSchemas[slug].safeParse(page.content);
    if (!parsed.success) {
      this.logger.error(`Contenu invalide pour la page « ${slug} » : ${parsed.error.message}`);
      throw new InternalServerErrorException('Contenu de la page invalide.');
    }
    return { slug, title: page.title, content: parsed.data, updatedAt: page.updatedAt.toISOString() };
  }

  /** Retourne false quand la demande vient d'un robot (champ piège rempli) : rien n'est enregistré. */
  async createJoinRequest({ website, ...data }: JoinRequestData): Promise<boolean> {
    if (website) {
      this.logger.warn("Demande d'adhésion ignorée : champ piège rempli.");
      return false;
    }
    const request = await this.prisma.joinRequest.create({ data });
    this.logger.log(`Nouvelle demande d'adhésion ${request.id} en attente de validation.`);
    return true;
  }

  async createContactMessage({ website, ...data }: ContactMessageData): Promise<boolean> {
    if (website) {
      this.logger.warn('Message de contact ignoré : champ piège rempli.');
      return false;
    }
    const message = await this.prisma.contactMessage.create({ data });
    this.logger.log(`Nouveau message de contact ${message.id}.`);
    return true;
  }
}
