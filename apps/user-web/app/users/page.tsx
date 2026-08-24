'use client';

import React, { useEffect } from 'react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserProfile } from '@mall/types';
import { UserSearchToolbar } from '@/component/user/UserSearchToolbar';
import { UserTable } from '@/component/user/UserTable';
import { UserDetailPanel } from '@/component/user/UserDetailPanel';

const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr_admin_01',
    email: 'admin@shoppingmall.com',
    name: '최고관리자',
    role: 'ADMIN',
    department: '운영팀',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr_client_01',
    email: 'kim@example.com',
    name: '김철수',
    role: 'CLIENT',
    recipientName: '김철수',
    phone: '010-1234-5678',
    address: {
      zonecode: '06134',
      address: '서울특별시 강남구 테헤란로 123',
      detail: '401호',
    },
    isOnboarded: true,
    createdAt: '2026-02-15T09:30:00Z',
    updatedAt: '2026-02-15T09:35:00Z',
  },
  {
    id: 'usr_client_02',
    email: 'lee@example.com',
    name: '이영희',
    role: 'CLIENT',
    isOnboarded: false,
    createdAt: '2026-03-01T14:20:00Z',
    updatedAt: '2026-03-01T14:20:00Z',
  },
];

export default function UserManagementPage() {
  const {
    users,
    setUsers,
    selectedUser,
    isLoading,
    filters,
    handleKeywordChange,
    handleRoleFilterChange,
    handleOnboardedFilterChange,
    handleResetFilters,
    handleSelectUser,
    handleCloseDetail,
    handleRoleChange,
  } = useUserManagement();

  // 최초 로드 시 MOCK 데이터 세팅 (실제 환경에서는 Supabase/API 호출)
  useEffect(() => {
    setUsers(MOCK_USERS);
  }, [setUsers]);

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. 페이지 타이틀 영역 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>
          회원 관리
        </h1>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
          등록된 고객(Client) 및 관리자(Admin) 계정을 조회하고 권한과 상세 정보를 관리합니다.
        </p>
      </div>

      {/* 2. 검색 및 필터 툴바 */}
      <UserSearchToolbar
        filters={filters}
        onKeywordChange={handleKeywordChange}
        onRoleChange={handleRoleFilterChange}
        onOnboardedChange={handleOnboardedFilterChange}
        onReset={handleResetFilters}
      />

      {/* 3. 메인 콘텐츠 (테이블 + 우측 상세 패널 2-Pane) */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* 회원 테이블 (좌측 70%) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <UserTable
            users={users}
            selectedUserId={selectedUser?.id}
            onSelectUser={handleSelectUser}
            isLoading={isLoading}
          />
        </div>

        {/* 선택된 유저 상세 정보 패널 (우측 30%) */}
        {selectedUser && (
          <UserDetailPanel
            user={selectedUser}
            onClose={handleCloseDetail}
            onRoleChange={handleRoleChange}
          />
        )}
      </div>
    </div>
  );
}