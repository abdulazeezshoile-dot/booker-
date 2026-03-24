import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendEmail(input: SendEmailInput): Promise<void> {
    const enabled = (this.configService.get<string>('MAILJET_ENABLED') || 'true') === 'true';
    if (!enabled) {
      this.logger.log(`MAILJET_ENABLED=false. Skipping email send to ${input.to}`);
      return;
    }

    const apiKey = this.configService.get<string>('MAILJET_API_KEY');
    const apiSecret = this.configService.get<string>('MAILJET_API_SECRET');
    const fromEmail = this.configService.get<string>('MAILJET_FROM_EMAIL');
    const fromName = this.configService.get<string>('MAILJET_FROM_NAME') || 'BizRecord';

    if (!apiKey || !apiSecret || !fromEmail) {
      this.logger.error('Missing Mailjet credentials/config. Required: MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_FROM_EMAIL');
      return;
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName,
            },
            To: [{ Email: input.to }],
            Subject: input.subject,
            TextPart: input.text,
            HTMLPart: input.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Mailjet send failed (${response.status}): ${body}`);
    }
  }
}
