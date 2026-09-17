'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import type { Branch, Workspace } from '@/lib/types';

interface WorkspaceState {
  workspaces: Workspace[];
  branches: Branch[];
  currentWorkspaceId: string | null;
  activeBranchId: string | null;
  currentWorkspace: Workspace | null;
  activeBranch: Branch | null;
  loading: boolean;
  error: string | null;
  setCurrentWorkspaceId: (id: string) => void;
  setActiveBranchId: (id: string | null) => void;
  reload: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceState>({
  workspaces: [],
  branches: [],
  currentWorkspaceId: null,
  activeBranchId: null,
  currentWorkspace: null,
  activeBranch: null,
  loading: true,
  error: null,
  setCurrentWorkspaceId: () => {},
  setActiveBranchId: () => {},
  reload: async () => {},
});

const WS_KEY = 'bizrecord-workspace';
const BRANCH_KEY = 'bizrecord-branch';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<Workspace[]>('/workspaces');
      const arr = Array.isArray(list) ? list : [];
      setWorkspaces(arr);
      setError(null);

      setCurrentWorkspaceIdState((prev) => {
        if (prev && arr.some((w) => w.id === prev)) return prev;
        const stored = window.localStorage.getItem(WS_KEY);
        return arr.some((w) => w.id === stored) ? stored : (arr[0]?.id ?? null);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentWorkspaceId) {
      setBranches([]);
      setActiveBranchIdState(null);
      return;
    }
    let cancelled = false;
    api
      .get<Branch[]>(`/workspaces/${currentWorkspaceId}/branches`)
      .then((list) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setBranches(arr);
        setActiveBranchIdState((prev) => {
          if (prev && arr.some((b) => b.id === prev)) return prev;
          const stored = window.localStorage.getItem(BRANCH_KEY);
          return arr.some((b) => b.id === stored) ? stored : null;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setBranches([]);
        setActiveBranchIdState(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceId]);

  const setCurrentWorkspaceId = useCallback((id: string) => {
    setCurrentWorkspaceIdState(id);
    window.localStorage.setItem(WS_KEY, id);
  }, []);

  const setActiveBranchId = useCallback((id: string | null) => {
    setActiveBranchIdState(id);
    if (id) window.localStorage.setItem(BRANCH_KEY, id);
    else window.localStorage.removeItem(BRANCH_KEY);
  }, []);

  const currentWorkspace = useMemo(
    () => workspaces.find((w) => w.id === currentWorkspaceId) ?? null,
    [workspaces, currentWorkspaceId],
  );
  const activeBranch = useMemo(
    () => branches.find((b) => b.id === activeBranchId) ?? null,
    [branches, activeBranchId],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        branches,
        currentWorkspaceId,
        activeBranchId,
        currentWorkspace,
        activeBranch,
        loading,
        error,
        setCurrentWorkspaceId,
        setActiveBranchId,
        reload,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
