// apps/user-web/app/users/page.tsx

"use client";

import { useEffect } from "react";

import UserManagementComponent from "@/component/user/UserManagementComponent";
import { useUserAdmin } from "@/hooks/users/userUserAdmin";

export default function UserManagementPage() {
  const {
    users,
    loading,
    error,
    fetchUsers,
  } = useUserAdmin();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        회원 정보를 불러오는 중입니다.
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <UserManagementComponent
      users={users}
      isLoading={loading}
    />
  );
}