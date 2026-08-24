'use client';

import React, { useState } from 'react';

interface SkuInput {
  skuId: string;
  optionName: string; // 예: "250", "XL"
  initialStock: number;
  safetyStock: number;
}

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productId: string;
    productName: string;
    category: string;
    skus: SkuInput[];
  }) => Promise<void>;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('SHOES');
  const [skus, setSkus] = useState<SkuInput[]>([
    { skuId: '', optionName: '250', initialStock: 10, safetyStock: 2 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // 옵션 항목 추가
  const handleAddSkuRow = () => {
    setSkus((prev) => [
      ...prev,
      { skuId: '', optionName: '', initialStock: 0, safetyStock: 0 },
    ]);
  };

  // 옵션 항목 삭제
  const handleRemoveSkuRow = (index: number) => {
    if (skus.length === 1) {
      alert('최소 1개 이상의 옵션(SKU)이 필요합니다.');
      return;
    }
    setSkus((prev) => prev.filter((_, i) => i !== index));
  };

  // 옵션 필드 변경
  const handleSkuChange = (
    index: number,
    field: keyof SkuInput,
    value: string | number
  ) => {
    setSkus((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !productName) {
      alert('상품 ID와 상품명을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        productId,
        productName,
        category,
        skus,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || '재고 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          width: '650px',
          maxWidth: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>신규 상품 및 옵션 재고 등록</h2>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. 기본 상품 정보 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                상품 ID (Product ID) *
              </label>
              <input
                type="text"
                placeholder="예: PROD-SHOE-01"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                카테고리 *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
              >
                <option value="SHOES">신발 (SHOES)</option>
                <option value="CLOTHES">의류 (CLOTHES)</option>
                <option value="ACC">잡화 (ACC)</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                상품명 *
              </label>
              <input
                type="text"
                placeholder="예: 에어 러닝화"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '20px 0' }} />

          {/* 2. 옵션(SKU)별 재고 설정 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>사이즈 / 옵션 목록 (SKU)</h3>
              <button
                type="button"
                onClick={handleAddSkuRow}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: '#e7f5ff',
                  color: '#1c7ed6',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + 옵션 추가
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>옵션/사이즈명</th>
                  <th style={{ padding: '8px' }}>SKU 코드 (선택)</th>
                  <th style={{ padding: '8px', width: '90px' }}>초기 재고</th>
                  <th style={{ padding: '8px', width: '90px' }}>안전 재고</th>
                  <th style={{ padding: '8px', width: '50px', textAlign: 'center' }}>삭제</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((sku, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        placeholder="예: 250, XL"
                        value={sku.optionName}
                        onChange={(e) => handleSkuChange(index, 'optionName', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                        required
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        placeholder={`${productId}-${sku.optionName || index}`}
                        value={sku.skuId}
                        onChange={(e) => handleSkuChange(index, 'skuId', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        min="0"
                        value={sku.initialStock}
                        onChange={(e) => handleSkuChange(index, 'initialStock', Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        min="0"
                        value={sku.safetyStock}
                        onChange={(e) => handleSkuChange(index, 'safetyStock', Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkuRow(index)}
                        style={{ border: 'none', background: 'none', color: '#fa5252', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. 하단 액션 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 16px', borderRadius: '4px', border: '1px solid #ced4da', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#1c7ed6',
                color: '#fff',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? '등록 중...' : '재고 등록 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};