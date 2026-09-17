import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../notifications/email.service';
import { EmailTemplateService } from '../notifications/email-template.service';
import { WorkspaceInvite } from '../workspace/entities/invite.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(WorkspaceInvite)
    private invitesRepository: Repository<WorkspaceInvite>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  private generateSixDigitCode() {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private async sendAuthEmail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    try {
      await this.emailService.sendEmail(input);
    } catch {
      throw new InternalServerErrorException(
        'Unable to send email right now. Please try again shortly.',
      );
    }
  }

  private async sendVerificationEmail(user: User) {
    if (!user.emailVerificationCode) return;

    const html = this.emailTemplateService.emailVerification(
      user.emailVerificationCode,
    );

    await this.sendAuthEmail({
      to: user.email,
      subject: 'Verify your BizRecord account',
      text: `Your BizRecord verification code is ${user.emailVerificationCode}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
      html,
    });
  }

  private async sendResetEmail(user: User) {
    if (!user.passwordResetCode) return;

    const html = this.emailTemplateService.passwordReset(
      user.passwordResetCode,
    );

    await this.sendAuthEmail({
      to: user.email,
      subject: 'BizRecord password reset code',
      text: `Your BizRecord password reset code is ${user.passwordResetCode}. It expires in 10 minutes. If you did not request this, please secure your account immediately.`,
      html,
    });
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      // Ownership is granted when this person creates a paid workspace. New
      // accounts may instead be invitees, whose workspace role is staff or
      // manager and must not inherit owner permissions.
      role: 'user',
      plan: null,
      onboardingStatus: 'pending_email_verification',
      trialStartAt: null,
      trialEndsAt: null,
      trialStatus: 'expired',
      emailVerified: false,
      emailVerificationCode: this.generateSixDigitCode(),
      emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      emailVerificationLastSentAt: new Date(),
    });

    await this.usersRepository.save(user);
    await this.sendVerificationEmail(user);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please verify your email with OTP code.',
      );
    }

    // An invite can arrive after the user has verified their email. Re-check it
    // at sign-in so team members never enter the owner payment onboarding.
    if (user.onboardingStatus !== 'complete') {
      const invite = await this.invitesRepository.findOne({
        where: { email: user.email.toLowerCase(), status: 'pending' },
        order: { createdAt: 'DESC' },
      });
      if (invite && (!invite.expiresAt || invite.expiresAt.getTime() > Date.now())) {
        user.onboardingStatus = 'complete';
        await this.usersRepository.save(user);
      }
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;
    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['memberships', 'memberships.workspace'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserProfile(userId: string) {
    return this.validateUser(userId);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestException('Invalid verification request');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      throw new BadRequestException(
        'Verification code not found. Request a new code.',
      );
    }

    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Verification code expired. Request a new code.',
      );
    }

    if (user.emailVerificationCode !== dto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.emailVerified = true;
    const invite = await this.invitesRepository.findOne({
      where: { email: user.email.toLowerCase(), status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    // Team members join an owner-paid workspace and must never be sent through
    // the owner subscription checkout.
    user.onboardingStatus =
      invite && (!invite.expiresAt || invite.expiresAt.getTime() > Date.now())
        ? 'complete'
        : 'pending_payment';
    user.emailVerificationCode = null;
    user.emailVerificationExpiresAt = null;
    await this.usersRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      return { message: 'If account exists, verification code will be sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    const now = Date.now();
    if (
      user.emailVerificationLastSentAt &&
      now - user.emailVerificationLastSentAt.getTime() < 60 * 1000
    ) {
      throw new BadRequestException(
        'Please wait at least 60 seconds before requesting another code.',
      );
    }

    user.emailVerificationCode = this.generateSixDigitCode();
    user.emailVerificationExpiresAt = new Date(now + 10 * 60 * 1000);
    user.emailVerificationLastSentAt = new Date(now);
    await this.usersRepository.save(user);
    await this.sendVerificationEmail(user);

    return { message: 'Verification code sent' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      return { message: 'If account exists, reset code will be sent.' };
    }

    const now = Date.now();
    if (
      user.passwordResetLastSentAt &&
      now - user.passwordResetLastSentAt.getTime() < 60 * 1000
    ) {
      throw new BadRequestException(
        'Please wait at least 60 seconds before requesting another code.',
      );
    }

    user.passwordResetCode = this.generateSixDigitCode();
    user.passwordResetExpiresAt = new Date(now + 10 * 60 * 1000);
    user.passwordResetLastSentAt = new Date(now);
    await this.usersRepository.save(user);
    await this.sendResetEmail(user);

    return { message: 'If account exists, reset code will be sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user || !user.passwordResetCode || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Invalid reset request');
    }

    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset code expired. Request a new code.');
    }

    if (user.passwordResetCode !== dto.code) {
      throw new BadRequestException('Invalid reset code');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetCode = null;
    user.passwordResetExpiresAt = null;
    await this.usersRepository.save(user);

    return { message: 'Password reset successful' };
  }
}
