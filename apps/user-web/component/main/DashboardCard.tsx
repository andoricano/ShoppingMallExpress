// components/DashboardCard.tsx
import React from 'react';

export interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  badgeCount?: number;         // 긴급 알림 배지 (취소/반품, 품절임박 등)
  badgeColor?: string;
  mainText: string;            // 핵심 지표 (예: "미배송 12건", "신규 +8명")
  subText?: string;            // 부가 정보 (예: "오늘 누적 1,200,000원")
  thumbnails?: string[];       // 재고/상품 카드용 썸네일 리스트
  href: string;                // 이동할 페이지 라우트 경로
  onClick?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  badgeCount = 0,
  badgeColor = '#ff4d4f',
  mainText,
  subText,
  thumbnails = [],
  href,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '160px',
      }}
    >
      {/* 1. 카운터 배지 (알림이 있을 경우) */}
      {badgeCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: badgeColor,
            color: '#fff',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '10px',
          }}
        >
          {badgeCount}
        </span>
      )}

      {/* 2. 카드 헤더 (아이콘 + 타이틀) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
        <h4 style={{ margin: 0, fontSize: '15px', color: '#495057', fontWeight: 600 }}>
          {title}
        </h4>
      </div>

      {/* 3. 카드 메인 콘텐츠 (지표/썸네일) */}
      <div>
        {thumbnails.length > 0 ? (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {thumbnails.slice(0, 3).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt="thumb"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  border: '1px solid #dee2e6',
                }}
              />
            ))}
          </div>
        ) : null}

        <div style={{ fontSize: '20px', fontWeight: 700, color: '#212529' }}>
          {mainText}
        </div>
        {subText && (
          <div style={{ fontSize: '12px', color: '#868e96', marginTop: '4px' }}>
            {subText}
          </div>
        )}
      </div>

      {/* 4. 바로가기 링크 표시 */}
      <div
        style={{
          fontSize: '12px',
          color: '#228be6',
          fontWeight: 600,
          textAlign: 'right',
        }}
      >
        바로가기 →
      </div>
    </div>
  );
};