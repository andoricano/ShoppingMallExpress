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
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    >
      <table
        style={{
          width: '100%',
          tableLayout: 'fixed', // 컬럼 폭 강제 고정
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '14px',
        }}
      >
        <colgroup>
          <col style={{ width: '26%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr
            style={{
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #dee2e6',
              color: '#495057',
            }}
          >
            <th style={{ padding: '12px 16px' }}>이름</th>
            <th style={{ padding: '12px 16px' }}>역할 (Role)</th>
            <th style={{ padding: '12px 16px' }}>연락처</th>
            <th style={{ padding: '12px 16px' }}>온보딩 상태</th>
            <th style={{ padding: '12px 16px' }}>가입일</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {/* 1. 로딩 상태 */}
          {isLoading ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: '60px 16px',
                  textAlign: 'center',
                  color: '#6c757d',
                }}
              >
                유저 목록을 불러오는 중입니다...
              </td>
            </tr>
          ) : users.length === 0 ? (
            /* 2. 검색 결과 없음 (테이블 헤더/폭 유지) */
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: '60px 16px',
                  textAlign: 'center',
                  color: '#6c757d',
                }}
              >
                검색 결과와 일치하는 유저가 없습니다.
              </td>
            </tr>
          ) : (
            /* 3. 정상 목록 */
            users.map((user) => {
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
                  <td
                    style={{
                      padding: '12px 16px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#212529' }}>
                      {user.name || '이름 없음'}
                    </div>
                  </td>

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

                  <td style={{ padding: '12px 16px', color: '#495057' }}>
                    {user.role === 'CLIENT' ? user.phone || '-' : '-'}
                  </td>

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

                  <td style={{ padding: '12px 16px', color: '#868e96' }}>
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>

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
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
