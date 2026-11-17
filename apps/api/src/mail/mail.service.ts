import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Envoi des e-mails. Avec SMTP_URL (ex. relais SMTP de l'offre gratuite Brevo), les messages partent
 * réellement ; sans, ils sont écrits dans le journal, ce qui suffit en développement.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: Transporter | null = process.env.SMTP_URL
    ? createTransport(process.env.SMTP_URL)
    : null;
  private readonly from = process.env.MAIL_FROM ?? 'Famille Wodie <no-reply@famille-wodie.local>';

  async send(message: MailMessage): Promise<void> {
    if (!this.transport) {
      this.logger.log(`E-mail (non envoyé, SMTP_URL absent) à ${message.to} — ${message.subject}\n${message.text}`);
      return;
    }
    await this.transport.sendMail({ from: this.from, ...message });
  }
}
