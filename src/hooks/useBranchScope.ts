import { useMemo } from 'react';
import { useOS } from '../contexts/OSContext';

export function useBranchScope() {
  const { data, activeBranchId, setActiveBranchId, lang } = useOS();

  const activeBranch = useMemo(
    () =>
      activeBranchId === 'all'
        ? null
        : data.branches.find((b) => b.id === activeBranchId) ?? null,
    [activeBranchId, data.branches]
  );

  const scopeLabel = activeBranch
    ? lang === 'ar'
      ? activeBranch.name
      : activeBranch.nameEn
    : lang === 'ar'
    ? 'جميع الفروع'
    : 'All Branches';

  return {
    branches: data.branches,
    activeBranchId,
    setActiveBranchId,
    activeBranch,
    scopeLabel,
  };
}
