import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { User } from '../auth/entities/user.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { BillingService } from '../billing/billing.service';
import { WorkspaceInvite } from './entities/invite.entity';
import { EmailQueueService } from '../notifications/email-queue.service';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(WorkspaceInvite)
    private invitesRepository: Repository<WorkspaceInvite>,
    private billingService: BillingService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async createWorkspace(createWorkspaceDto: CreateWorkspaceDto, userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['workspaces'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.billingService.getCurrentSubscription(userId);
    const normalizedPlan: 'basic' | 'pro' = subscription.plan === 'pro' ? 'pro' : 'basic';
    const planLimit = subscription.limits.workspaceLimit;
    const currentWorkspaceCount = subscription.limits.workspaceUsed;

    if (subscription.upgradeRequired) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Your trial has ended. Please upgrade to a paid plan to continue.',
        meta: {
          plan: normalizedPlan,
          feature: 'workspace.create',
        },
      });
    }

    if (currentWorkspaceCount >= planLimit) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'PLAN_LIMIT_REACHED',
        message:
          normalizedPlan === 'basic'
            ? 'Your Basic plan allows only 1 workspace. Upgrade your plan to add more.'
            : 'Your Pro plan allows up to 3 workspaces. Upgrade your plan to increase this limit.',
        meta: {
          plan: normalizedPlan,
          limit: planLimit,
          current: currentWorkspaceCount,
          feature: 'workspace.create',
        },
      });
    }

    let managerUser: User | null = null;

    if (createWorkspaceDto.parentWorkspaceId) {
      const parentWorkspace = await this.workspacesRepository.findOne({
        where: { id: createWorkspaceDto.parentWorkspaceId },
        relations: ['users', 'createdBy'],
      });

      if (!parentWorkspace) {
        throw new NotFoundException('Parent workspace not found');
      }

      const canManageParent =
        parentWorkspace.createdBy?.id === userId ||
        user.role === 'owner' ||
        user.role === 'admin' ||
        user.role === 'super_admin';

      if (!canManageParent) {
        throw new BadRequestException('You are not allowed to create a branch for this workspace');
      }

      if (createWorkspaceDto.managerUserId) {
        managerUser = await this.usersRepository.findOne({ where: { id: createWorkspaceDto.managerUserId } });
        if (!managerUser) {
          throw new NotFoundException('Selected manager user not found');
        }
      }
    }

    const slug = createWorkspaceDto.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const existingWorkspace = await this.workspacesRepository.findOne({
      where: { slug },
    });

    if (existingWorkspace) {
      throw new BadRequestException('Workspace with this name already exists');
    }

    const workspace = this.workspacesRepository.create({
      ...createWorkspaceDto,
      slug,
      parentWorkspaceId: createWorkspaceDto.parentWorkspaceId || null,
      managerUserId: managerUser?.id || null,
      managerUser: managerUser || null,
      createdBy: user,
      users: managerUser && managerUser.id !== user.id ? [user, managerUser] : [user],
    });

    const saved = await this.workspacesRepository.save(workspace);

    // Ensure legacy users are upgraded to owner when they create a workspace
    if (user.role === 'user' || user.role === 'admin') {
      user.role = 'owner';
      await this.usersRepository.save(user);
    }

    return saved;
  }

  async getWorkspaces(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['workspaces'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.workspaces || [];
  }

  async getWorkspace(workspaceId: string) {
    const workspace = await this.workspacesRepository.findOne({
      where: { id: workspaceId },
      relations: ['users', 'createdBy', 'parentWorkspace'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async updateWorkspace(workspaceId: string, updateData: Partial<Workspace>) {
    const workspace = await this.getWorkspace(workspaceId);
    Object.assign(workspace, updateData);
    return await this.workspacesRepository.save(workspace);
  }

  async getBranches(workspaceId: string, userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['workspaces'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasAccess = user.workspaces?.some((workspace) => workspace.id === workspaceId);
    if (!hasAccess) {
      throw new NotFoundException('Workspace not found');
    }

    return this.workspacesRepository.find({
      where: { parentWorkspaceId: workspaceId },
      relations: ['createdBy', 'users', 'managerUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findWorkspaceUserByEmail(workspaceId: string, requesterId: string, email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    const workspace = await this.workspacesRepository.findOne({
      where: { id: workspaceId },
      relations: ['users', 'createdBy'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const requester = await this.usersRepository.findOne({ where: { id: requesterId } });
    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    const canManageWorkspace =
      workspace.createdBy?.id === requesterId ||
      requester.role === 'owner' ||
      requester.role === 'admin' ||
      requester.role === 'super_admin';

    if (!canManageWorkspace) {
      throw new BadRequestException('You are not allowed to manage this workspace');
    }

    const foundUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    const alreadyMember = workspace.users?.some((member) => member.id === foundUser.id) || false;

    return {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      alreadyMember,
    };
  }

  async addUserToWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.getWorkspace(workspaceId);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!workspace.users) {
      workspace.users = [];
    }

    const userExists = workspace.users.some((u) => u.id === userId);
    if (userExists) {
      throw new BadRequestException('User already belongs to this workspace');
    }

    workspace.users.push(user);
    return await this.workspacesRepository.save(workspace);
  }

  async removeUserFromWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.getWorkspace(workspaceId);
    workspace.users = workspace.users.filter((u) => u.id !== userId);
    return await this.workspacesRepository.save(workspace);
  }

  async inviteUser(workspaceId: string, requesterId: string, inviteDto: { email: string; role?: string }) {
    const normalizedEmail = inviteDto.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }
    const workspace = await this.getWorkspace(workspaceId);
    const requester = await this.usersRepository.findOne({ where: { id: requesterId } });
    if (!requester) {
      throw new NotFoundException('Requester not found');
    }
    const canManageWorkspace =
      workspace.createdBy?.id === requesterId ||
      requester.role === 'owner' ||
      requester.role === 'admin' ||
      requester.role === 'super_admin';
    if (!canManageWorkspace) {
      throw new BadRequestException('You are not allowed to manage this workspace');
    }
    // Check if user exists
    let user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    let alreadyMember = user && workspace.users?.some((member) => member.id === user.id);
    if (alreadyMember) {
      throw new BadRequestException('User already belongs to this workspace');
    }
    // Create invite record
    const invite = this.invitesRepository.create({
      email: normalizedEmail,
      userId: user?.id || null,
      workspaceId,
      status: 'pending',
      role: inviteDto.role || 'staff',
    });
    await this.invitesRepository.save(invite);
    // Send invite email
    this.emailQueueService.enqueue({
      to: normalizedEmail,
      subject: `Invitation to join workspace '${workspace.name}'`,
      text: `You have been invited to join workspace '${workspace.name}'. Click the link to accept.`,
      html: `<p>You have been invited to join workspace '<b>${workspace.name}</b>'.<br/>Click the link to accept.</p>`,
    });
    return { invited: true, email: normalizedEmail, workspaceId, inviteId: invite.id };
  }
}
