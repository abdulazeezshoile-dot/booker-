'use client';

import { useWorkspace } from '@/context/WorkspaceContext';

/**
 * Builds the workspace/branch-scoped API base paths used by every feature
 * screen, mirroring the mobile app's path selection logic.
 */
export function useScope() {
  const { currentWorkspaceId, activeBranchId } = useWorkspace();

  const scopePrefix = currentWorkspaceId
    ? activeBranchId
      ? `/workspaces/${currentWorkspaceId}/branches/${activeBranchId}`
      : `/workspaces/${currentWorkspaceId}`
    : null;

  return {
    currentWorkspaceId,
    activeBranchId,
    ready: Boolean(currentWorkspaceId),
    transactionsPath: scopePrefix ? `${scopePrefix}/transactions` : null,
    inventoryPath: scopePrefix ? `${scopePrefix}/inventory` : null,
    customersPath: scopePrefix ? `${scopePrefix}/customers` : null,
  };
}
