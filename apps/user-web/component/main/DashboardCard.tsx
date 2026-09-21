'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  badgeCount?: number;
  badgeColor?: string;
  mainText: string;
  subText?: string;
  thumbnails?: string[];
  detailItems?: string[];
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
  detailItems = [],
  href,
  onClick,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (href) {
      router.push(href);
    }
  };

  return (
    <div
      onClick={handleClick}
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

        {detailItems.length > 0 ? (
          <div style={{ marginBottom: '8px', fontSize: '11px', color: '#495057' }}>
            {detailItems.slice(0, 3).map((item) => (
              <div key={item}>{item}</div>
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
