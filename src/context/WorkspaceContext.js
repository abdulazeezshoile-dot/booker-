import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const WorkspaceContext = createContext();

export const WorkspaceProvider = function({ children }) {
  const workspacesState = useState([
    { id: '1', name: 'Main Warehouse', createdBy: 'admin1' },
    { id: '2', name: 'Branch Office', createdBy: 'admin1' }
  ]);
  const workspaces = workspacesState[0];
  const setWorkspaces = workspacesState[1];

  const currentWorkspaceState = useState('1');
  const currentWorkspaceId = currentWorkspaceState[0];
  const setCurrentWorkspaceId = currentWorkspaceState[1];

  const currentUserState = useState('user1');
  const currentUser = currentUserState[0];
  const setCurrentUser = currentUserState[1];

  const userRolesState = useState({
    user1: { '1': 'admin', '2': 'branch_manager' },
    user2: { '1': 'branch_manager', '2': 'branch_manager' }
  });
  const userRoles = userRolesState[0];
  const setUserRoles = userRolesState[1];

  const getCurrentUserRole = useCallback(function() {
    if (userRoles[currentUser] && userRoles[currentUser][currentWorkspaceId]) {
      return userRoles[currentUser][currentWorkspaceId];
    }
    return 'viewer';
  }, [userRoles, currentUser, currentWorkspaceId]);

  const isAdmin = useCallback(function() {
    return getCurrentUserRole() === 'admin';
  }, [getCurrentUserRole]);

  const isBranchManager = useCallback(function() {
    return getCurrentUserRole() === 'branch_manager';
  }, [getCurrentUserRole]);

  const value = useMemo(function() {
    return {
      workspaces: workspaces,
      setWorkspaces: setWorkspaces,
      currentWorkspaceId: currentWorkspaceId,
      setCurrentWorkspaceId: setCurrentWorkspaceId,
      currentUser: currentUser,
      setCurrentUser: setCurrentUser,
      userRoles: userRoles,
      setUserRoles: setUserRoles,
      getCurrentUserRole: getCurrentUserRole,
      isAdmin: isAdmin,
      isBranchManager: isBranchManager
    };
  }, [workspaces, currentWorkspaceId, currentUser, userRoles, getCurrentUserRole, isAdmin, isBranchManager]);

  return React.createElement(WorkspaceContext.Provider, { value: value }, children);
};

export const useWorkspace = function() { return useContext(WorkspaceContext); };

export default WorkspaceContext;
