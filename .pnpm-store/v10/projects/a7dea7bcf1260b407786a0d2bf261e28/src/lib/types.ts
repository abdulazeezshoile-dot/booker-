/**
 * Shapes mirrored from the NestJS entities in backend/src/modules/**.
 * Numeric columns are TypeORM `decimal`, which serialize as strings over JSON,
 * so anything money-shaped is typed `Numeric` and read through `toNumber()`.
 */

export type Numeric = number | string;

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'manager'
  | 'staff'
  | 'user';

export type Plan = 'basic' | 'pro';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  plan: Plan | null;
  onboardingStatus?: 'pending_email_verification' | 'pending_payment' | 'complete';
  trialStartAt?: string | null;
  trialEndsAt?: string | null;
  trialStatus?: 'active' | 'expired' | 'converted';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceRole = 'owner' | 'manager' | 'staff';

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  status: 'active' | 'inactive' | 'archived';
  slug: string;
  parentWorkspaceId?: string | null;
  role?: WorkspaceRole;
  billingPlan?: Plan;
  readOnly?: boolean;
  primaryWorkspaceId?: string | null;
  managerUser?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  status: 'active' | 'inactive' | 'archived';
  workspaceId: string;
  managerUserId?: string | null;
  managerUser?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type ItemStatus = 'available' | 'out_of_stock' | 'discontinued';

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  quantity: Numeric;
  costPrice: Numeric;
  sellingPrice?: Numeric | null;
  reorderLevel: Numeric;
  category?: string | null;
  location?: string | null;
  supplier?: string | null;
  status: ItemStatus;
  workspaceId: string | null;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'sale'
  | 'expense'
  | 'purchase'
  | 'return'
  | 'adjustment'
  | 'debt';

export type PaymentMethod = 'cash' | 'card' | 'bank' | 'check' | 'credit';

export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface TransactionLineItem {
  itemId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
  name?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  referenceNumber?: string | null;
  item?: InventoryItem | null;
  quantity: Numeric;
  unitPrice: Numeric;
  totalAmount: Numeric;
  discountAmount: Numeric;
  category?: string | null;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerName?: string | null;
  customerEmail?: string | null;
  phone?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  lineItems?: TransactionLineItem[] | null;
  workspaceId: string | null;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  workspaceId: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalSales: number;
  totalExpenses: number;
  totalPurchases: number;
  profit: number;
  transactionCount: number;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role?: string | null;
  status?: string;
  workspaceId?: string;
  workspace?: { id: string; name: string } | null;
  branchId?: string | null;
  branchRole?: 'manager' | 'staff' | null;
  createdAt?: string;
  expiresAt?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  workspaceId?: string;
  branchId?: string | null;
  user?: { id: string; name: string; email: string } | null;
  actor?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  quantity: Numeric;
  status: string;
  notes?: string | null;
  item?: InventoryItem | null;
  fromBranch?: Branch | null;
  toBranch?: Branch | null;
  fromBranchId?: string | null;
  toBranchId?: string | null;
  createdAt: string;
}

/** Branch permission keys accepted by the workspace invite/member endpoints. */
export const BRANCH_PERMISSIONS = [
  'inventory.view',
  'inventory.manage',
  'transactions.view',
  'transactions.manage',
  'customers.view',
  'customers.manage',
  'reports.view',
  'team.manage',
] as const;

export type BranchPermissionKey = (typeof BRANCH_PERMISSIONS)[number];

export interface BranchMember {
  id?: string;
  userId: string;
  branchId?: string;
  role: 'manager' | 'staff';
  permissions?: BranchPermissionKey[];
  isActive?: boolean;
  user?: { id: string; name: string; email: string };
}

export interface ManagementOverview {
  workspace?: Workspace;
  branches?: Array<
    Branch & {
      inventoryCount?: number;
      salesAmount?: number;
      salesCount?: number;
      memberCount?: number;
      members?: BranchMember[];
    }
  >;
  members?: Array<{
    userId: string;
    role: WorkspaceRole;
    user?: { id: string; name: string; email: string };
  }>;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  billingCycle?: string | null;
  currentPeriodEnd?: string | null;
  createdAt?: string;
}
