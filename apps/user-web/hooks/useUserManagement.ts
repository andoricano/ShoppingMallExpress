import { RoleFilterValue, UserSearchFilterState } from "@/component/user/UserSearchToolbar";
import { useAdminAuthStore } from "@/store/useAdminAuth";
import { OnboardedFilterValue } from "@/types/useManagement";
import { UserProfile, UserRole } from "@mall/types";
import { useState, useMemo, useCallback } from "react";

interface UseUserManagementParams {
  users: UserProfile[];
  onUsersChange: (users: UserProfile[]) => void;
}

export function useUserManagement({
  users,
  onUsersChange,
}: UseUserManagementParams) {
  const currentUser = useAdminAuthStore((state) => state.user);

  // 3. 선택된 유저 (상세 패널 표시용)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // 4. 검색 및 필터링 상태
  const [filters, setFilters] = useState<UserSearchFilterState>({
    keyword: "",
    role: "ALL",
    onboarded: "ALL",
  });

  const [actionError, setActionError] = useState<string | null>(null);

  // 검색어/필터 체인지 핸들러
  const handleKeywordChange = useCallback((keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword }));
  }, []);

  const handleRoleFilterChange = useCallback((role: RoleFilterValue) => {
    setFilters((prev) => ({ ...prev, role }));
  }, []);

  const handleOnboardedFilterChange = useCallback(
    (onboarded: OnboardedFilterValue) => {
      setFilters((prev) => ({ ...prev, onboarded }));
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      keyword: "",
      role: "ALL",
      onboarded: "ALL",
    });
  }, []);

  // 5. 클라이언트 사이드 검색/필터링 필터링 로직 (Discriminated Union 적용)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 키워드 검색 (이름, 이메일, 연락처)
      const keywordLower = filters.keyword.trim().toLowerCase();
      const matchesKeyword =
        !keywordLower ||
        (u.name && u.name.toLowerCase().includes(keywordLower)) ||
        (u.role === "CLIENT" && u.phone && u.phone.includes(keywordLower));

      // Role 필터
      const matchesRole =
        filters.role === "ALL" || u.role === filters.role;

      // 온보딩 필터 (CLIENT 전용 프로필 조건)
      let matchesOnboarded = true;
      if (filters.onboarded !== "ALL") {
        if (u.role === "CLIENT") {
          matchesOnboarded =
            filters.onboarded === "COMPLETED" ? u.isOnboarded : !u.isOnboarded;
        } else {
          // ADMIN은 온보딩 개념이 없으므로 '미완료' 필터링 시 제외 처리
          matchesOnboarded = filters.onboarded === "COMPLETED";
        }
      }

      return matchesKeyword && matchesRole && matchesOnboarded;
    });
  }, [users, filters]);

  // 6. 유저 선택 핸들러
  const handleSelectUser = useCallback((user: UserProfile) => {
    setSelectedUser(user);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedUser(null);
  }, []);

  // 7. 유저 Role 변경 핸들러 (본인 권한 변경 방지 예외 처리 포함)
  const handleRoleChange = useCallback(
    async (targetUserId: string, newRole: UserRole) => {
      setActionError(null);

      // 본인 계정 변경 제약 (PRD Edge Case)
      if (currentUser?.id === targetUserId) {
        alert("현재 로그인된 관리자 본인의 권한은 변경할 수 없습니다.");
        return;
      }

      if (!confirm(`해당 회원의 권한을 ${newRole}(으)로 변경하시겠습니까?`)) {
        return;
      }

      try {
        const targetUser = users.find(
          (user) => user.id === targetUserId,
        );

        if (!targetUser) {
          return;
        }

        if (newRole !== "ADMIN") {
          throw new Error("User role demotion is not part of the confirmed contract.");
        }

        const res = await fetch(
          `/api/admin/users/${targetUser.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: "ADMIN" }),
          },
        );

        const result: {
          data?: UserProfile;
          message?: string;
        } | null = await res.json().catch(() => null);

        if (!res.ok || !result?.data) {
          throw new Error(
            result?.message ||
            "회원 역할 변경에 실패했습니다.",
          );
        }

        const nextUsers = users.map((user) =>
          user.id === targetUserId
            ? result.data as UserProfile
            : user,
        );

        onUsersChange(nextUsers);
        setSelectedUser(result.data);
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "회원 역할 변경에 실패했습니다.",
        );
      }
    },
    [currentUser, onUsersChange, users]
  );
  return {
    // State
    users: filteredUsers,
    selectedUser,
    actionError,
    filters,
    currentUser,

    // Handlers
    handleKeywordChange,
    handleRoleFilterChange,
    handleOnboardedFilterChange,
    handleResetFilters,
    handleSelectUser,
    handleCloseDetail,
    handleRoleChange,
  };
}
