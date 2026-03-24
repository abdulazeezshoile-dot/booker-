import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailQueueService } from './email-queue.service';
import { PushService } from './push.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailQueueService, PushService],
  exports: [EmailService, EmailQueueService, PushService],
})
export class NotificationsModule {}
