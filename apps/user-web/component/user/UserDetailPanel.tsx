import { UserProfile, UserRole } from '@mall/types';
import React, { useState } from 'react';


interface UserDetailPanelProps {
  user: UserProfile | null;
  onClose: () => void;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  // 향후 주문/결제 이력 데이터 연동용 (필요 시 확장)
  orderHistory?: Array<{ id: string; orderNo: string; createdAt: string; amount: number }>;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  user,
  onClose,
  onRoleChange,
  orderHistory = [],
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  if (!user) return null;

  return (
    <div
      style={{
        width: '380px',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* 헤더 & 닫기 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>회원 상세 정보</h3>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#868e96',
          }}
        >
          ✕
        </button>
      </div>

      {/* 탭 메뉴 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e9ecef' }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            flex: 1,
            padding: '8px 0',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid #228be6' : 'none',
            fontWeight: activeTab === 'profile' ? 600 : 400,
            color: activeTab === 'profile' ? '#228be6' : '#495057',
            cursor: 'pointer',
          }}
        >
          기본 프로필
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '8px 0',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'history' ? '2px solid #228be6' : 'none',
            fontWeight: activeTab === 'history' ? 600 : 400,
            color: activeTab === 'history' ? '#228be6' : '#495057',
            cursor: 'pointer',
          }}
        >
          이력 (History)
        </button>
      </div>

      {/* 1. 기본 프로필 탭 */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
          {/* 공통 정보 (BaseProfile) */}
          <div>
            <div style={{ fontSize: '12px', color: '#868e96' }}>UID (Supabase)</div>
            <div style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{user.id}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#868e96' }}>이름</div>
            <div style={{ color: '#495057' }}>{user.name || '이름 미설정'}</div>
          </div>

          {/* Role 변경 제어 */}
          <div>
            <div style={{ fontSize: '12px', color: '#868e96', marginBottom: '4px' }}>역할 (Role)</div>
            <select
              value={user.role}
              onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '14px',
              }}
            >
              <option value="CLIENT">CLIENT (고객)</option>
              <option value="ADMIN">ADMIN (관리자)</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5', margin: '4px 0' }} />

          {/* 역할별 분기 프로필 (Discriminated Union) */}
          {user.role === 'CLIENT' ? (
            <>
              <div>
                <div style={{ fontSize: '12px', color: '#868e96' }}>수령인 / 연락처</div>
                <div>{user.recipientName || '-'} / {user.phone || '-'}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#868e96' }}>온보딩 상태</div>
                <div style={{ fontWeight: 500, color: user.isOnboarded ? '#2b8a3e' : '#f59f00' }}>
                  {user.isOnboarded ? '완료' : '미완료 (이탈)'}
                </div>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize: '12px', color: '#868e96' }}>소속 부서</div>
              <div>{user.department || '부서 미지정'}</div>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5', margin: '4px 0' }} />

          <div>
            <div style={{ fontSize: '12px', color: '#868e96' }}>가입일 / 수정일</div>
            <div>가입: {new Date(user.createdAt).toLocaleString('ko-KR')}</div>
            <div>수정: {new Date(user.updatedAt).toLocaleString('ko-KR')}</div>
          </div>
        </div>
      )}

      {/* 2. 이력 (History) 탭 */}
      {activeTab === 'history' && (
        <div style={{ fontSize: '14px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>주문 및 이용 내역</div>
          {orderHistory.length === 0 ? (
            <div style={{ padding: '20px 0', color: '#868e96', textAlign: 'center' }}>
              조회된 이력이 없습니다.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {orderHistory.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f3f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.orderNo}</div>
                    <div style={{ fontSize: '12px', color: '#868e96' }}>{item.createdAt}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{item.amount.toLocaleString()}원</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
