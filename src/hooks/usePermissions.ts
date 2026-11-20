import { useCallback } from 'react';
import { useOS } from '../contexts/OSContext';
import type { EmployeeProfile, ModuleKey, PermissionAction } from '../types/os';
import {
  canApproveOperation,
  canViewConfidentialPayroll,
  hasPermission,
  isRecordVisibleToUser,
  maskEmployeePII,
} from '../utils/rbac';

export function usePermissions() {
  const { currentUser, activeBranchId } = useOS();

  const can = useCallback(
    (module: ModuleKey, action: PermissionAction) =>
      hasPermission(currentUser, module, action),
    [currentUser]
  );

  const canApprove = useCallback(
    (requesterUid: string, module: ModuleKey) =>
      canApproveOperation(requesterUid, currentUser, module),
    [currentUser]
  );

  const isVisible = useCallback(
    <T extends { branchId?: string; assigneeUid?: string; managerUid?: string; memberUids?: string[] }>(
      record: T
    ) => isRecordVisibleToUser(record, currentUser, activeBranchId),
    [activeBranchId, currentUser]
  );

  const maskEmployee = useCallback(
    (target: EmployeeProfile) => maskEmployeePII(target, currentUser),
    [currentUser]
  );

  return {
    user: currentUser,
    can,
    canApprove,
    canViewPayroll: canViewConfidentialPayroll(currentUser),
    isVisible,
    maskEmployee,
  };
}
