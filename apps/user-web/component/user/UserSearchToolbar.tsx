import { UserRole } from '@mall/types';
import React from 'react';

export type OnboardedFilterValue = 'ALL' | 'COMPLETED' | 'PENDING';
export type RoleFilterValue = 'ALL' | UserRole;

export interface UserSearchFilterState {
  keyword: string;
  role: RoleFilterValue;
  onboarded: OnboardedFilterValue;
}

interface UserSearchToolbarProps {
  filters: UserSearchFilterState;
  onKeywordChange: (keyword: string) => void;
  onRoleChange: (role: RoleFilterValue) => void;
  onOnboardedChange: (onboarded: OnboardedFilterValue) => void;
  onReset: () => void;
}

export const UserSearchToolbar: React.FC<UserSearchToolbarProps> = ({
  filters,
  onKeywordChange,
  onRoleChange,
  onOnboardedChange,
  onReset,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '16px',
      }}
    >
      {/* 1. 키워드 검색 (이름, 이메일, 연락처) */}
      <div style={{ flex: 1 }}>
        <input
          type="text"
          value={filters.keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="이름, 이메일, 연락처 검색..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ced4da',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* 2. 역할 (Role) 필터 */}
      <div>
        <select
          value={filters.role}
          onChange={(e) => onRoleChange(e.target.value as RoleFilterValue)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ced4da',
            fontSize: '14px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">전체 권한</option>
          <option value="CLIENT">Client (고객)</option>
          <option value="ADMIN">Admin (관리자)</option>
        </select>
      </div>

      {/* 3. 온보딩 상태 필터 */}
      <div>
        <select
          value={filters.onboarded}
          onChange={(e) =>
            onOnboardedChange(e.target.value as OnboardedFilterValue)
          }
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ced4da',
            fontSize: '14px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">전체 온보딩</option>
          <option value="COMPLETED">온보딩 완료</option>
          <option value="PENDING">미완료 (이탈)</option>
        </select>
      </div>

      {/* 4. 필터 초기화 버튼 */}
      <button
        type="button"
        onClick={onReset}
        style={{
          padding: '8px 14px',
          borderRadius: '6px',
          border: '1px solid #ced4da',
          backgroundColor: '#fff',
          fontSize: '14px',
          color: '#495057',
          cursor: 'pointer',
        }}
      >
        초기화
      </button>
    </div>
  );
};