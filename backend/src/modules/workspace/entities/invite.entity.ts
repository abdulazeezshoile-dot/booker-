import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Workspace } from './workspace.entity';

@Entity('workspace_invites')
export class WorkspaceInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  userId: string | null;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'declined';

  @Column({ nullable: true })
  role: string;

  @CreateDateColumn()
  createdAt: Date;
}
