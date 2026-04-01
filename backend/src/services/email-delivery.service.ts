import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { getEnvFlag } from '../config/env';

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);
  private transport?: Transporter;

  private get mailEnabled(): boolean {
    return getEnvFlag(process.env.APP_MAIL_ENABLED, true);
  }

  private resolveTransport(): Transporter {
    if (this.transport) {
      return this.transport;
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || process.env.EMAIL_SENDER || '';
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '';
    const authEnabled = getEnvFlag(process.env.SMTP_AUTH, true);
    const startTls = getEnvFlag(process.env.SMTP_STARTTLS, true);

    this.transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: authEnabled ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
      requireTLS: startTls,
    });

    return this.transport;
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    if (!this.mailEnabled) {
      this.logger.log(`SMTP desabilitado. E-mail de verificacao nao enviado para ${to}. Assunto: ${subject}`);
      return;
    }

    const fromAddress = process.env.APP_MAIL_FROM || process.env.EMAIL_SENDER || process.env.SMTP_USER || '';
    if (!fromAddress) {
      throw new Error('Remetente de e-mail nao configurado (APP_MAIL_FROM/SMTP_USER).');
    }

    const transport = this.resolveTransport();
    await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      text: body,
    });
  }
}
