import { RoleFilterValue, UserSearchFilterState } from "@/component/user/UserSearchToolbar";
import { useAdminAuthStore } from "@/store/useAdminAuth";
import { OnboardedFilterValue } from "@/types/useManagement";
import { UserProfile, UserRole } from "@mall/types";
import { useState, useEffect, useMemo, useCallback } from "react";

export function useUserManagement() {
  // 1. 스토어 상태 및 메서어 연동
  const { user: currentUser, getSession } = useAdminAuthStore();

  // 2. 유저 목록 데이터 상태 (서버 API/Supabase 연동 전 임시 state 또는 Store 연동)
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. 선택된 유저 (상세 패널 표시용)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // 4. 검색 및 필터링 상태
  const [filters, setFilters] = useState<UserSearchFilterState>({
    keyword: "",
    role: "ALL",
    onboarded: "ALL",
  });

  // 최초 진입 시 세션 확인
  useEffect(() => {
    getSession();
  }, [getSession]);

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


  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch(
        "/api/users",
      );

      const result =
        await res
          .json()
          .catch(() => null);

      console.log(
        "[UserManagement] API Response:",
        result,
      );

      if (!res.ok) {
        throw new Error(
          result?.message ||
          "회원 목록 조회에 실패했습니다.",
        );
      }

      const nextUsers =
        Array.isArray(result?.data)
          ? (result.data as UserProfile[])
          : [];

      console.log(
        "[UserManagement] Users:",
        nextUsers,
      );

      setUsers(nextUsers);

      return nextUsers;
    } catch (err) {
      console.error(
        "[UserManagement] 회원 목록 조회 실패:",
        err,
      );

      setUsers([]);

      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);


  // 5. 클라이언트 사이드 검색/필터링 필터링 로직 (Discriminated Union 적용)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 키워드 검색 (이름, 이메일, 연락처)
      const keywordLower = filters.keyword.trim().toLowerCase();
      const matchesKeyword =
        !keywordLower ||
        (u.name && u.name.toLowerCase().includes(keywordLower)) ||
        u.email.toLowerCase().includes(keywordLower) ||
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
      // 본인 계정 변경 제약 (PRD Edge Case)
      if (currentUser?.id === targetUserId) {
        alert("현재 로그인된 관리자 본인의 권한은 변경할 수 없습니다.");
        return;
      }

      if (!confirm(`해당 회원의 권한을 ${newRole}(으)로 변경하시겠습니까?`)) {
        return;
      }

      // 서버/DB 권한 업데이트 로직 실행 위치
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id !== targetUserId) return u;

          // Discriminator 식별자에 맞춰 분기 업데이트
          if (newRole === "CLIENT") {
            return {
              ...u,
              role: "CLIENT",
              isOnboarded: false,
            };
          } else {
            return {
              ...u,
              role: "ADMIN",
            };
          }
        })
      );

      // 현재 선택된 상세 유저 객체도 동기화
      setSelectedUser((prev) => {
        if (prev?.id !== targetUserId) return prev;
        return newRole === "CLIENT"
          ? { ...prev, role: "CLIENT", isOnboarded: false }
          : { ...prev, role: "ADMIN" };
      });
    },
    [currentUser]
  );
  return {
    // State
    users: filteredUsers,
    rawUsers: users,
    setUsers,
    selectedUser,
    isLoading,
    setIsLoading,
    filters,
    currentUser,

    // Handlers
    fetchUsers,
    handleKeywordChange,
    handleRoleFilterChange,
    handleOnboardedFilterChange,
    handleResetFilters,
    handleSelectUser,
    handleCloseDetail,
    handleRoleChange,
    getSession,
  };
}