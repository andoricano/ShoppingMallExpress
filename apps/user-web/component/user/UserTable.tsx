import { UserProfile } from '@mall/types';
import React from 'react';

interface UserTableProps {
  users: UserProfile[];
  selectedUserId?: string | null;
  onSelectUser: (user: UserProfile) => void;
  isLoading?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
        유저 목록을 불러오는 중입니다...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
        }}
      >
        검색 결과와 일치하는 유저가 없습니다.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #dee2e6',
              color: '#495057',
            }}
          >
            <th style={{ padding: '12px 16px' }}>이름 / 이메일</th>
            <th style={{ padding: '12px 16px' }}>역할 (Role)</th>
            <th style={{ padding: '12px 16px' }}>연락처</th>
            <th style={{ padding: '12px 16px' }}>온보딩 상태</th>
            <th style={{ padding: '12px 16px' }}>가입일</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelected = selectedUserId === user.id;

            return (
              <tr
                key={user.id}
                onClick={() => onSelectUser(user)}
                style={{
                  borderBottom: '1px solid #e9ecef',
                  backgroundColor: isSelected ? '#e7f5ff' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* 1. 이름 및 이메일 */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#212529' }}>
                    {user.name || '이름 없음'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#868e96' }}>
                    {user.email}
                  </div>
                </td>

                {/* 2. 역할 (Role Badge) */}
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor:
                        user.role === 'ADMIN' ? '#e7f5ff' : '#f1f3f5',
                      color: user.role === 'ADMIN' ? '#1c7ed6' : '#495057',
                    }}
                  >
                    {user.role}
                  </span>
                </td>

                {/* 3. 연락처 (Client 전용 프로필 확인) */}
                <td style={{ padding: '12px 16px', color: '#495057' }}>
                  {user.role === 'CLIENT' ? user.phone || '-' : '-'}
                </td>

                {/* 4. 온보딩 상태 (Discriminated Union 분기 처리) */}
                <td style={{ padding: '12px 16px' }}>
                  {user.role === 'CLIENT' ? (
                    user.isOnboarded ? (
                      <span
                        style={{
                          color: '#2b8a3e',
                          fontWeight: 500,
                          fontSize: '13px',
                        }}
                      >
                        ● 완료
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#f59f00',
                          fontWeight: 500,
                          fontSize: '13px',
                        }}
                      >
                        ▲ 미완료
                      </span>
                    )
                  ) : (
                    <span style={{ color: '#adb5bd', fontSize: '13px' }}>
                      N/A
                    </span>
                  )}
                </td>

                {/* 5. 가입일 */}
                <td style={{ padding: '12px 16px', color: '#868e96' }}>
                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </td>

                {/* 6. 관리 버튼 */}
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectUser(user);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      backgroundColor: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};