// apps/develop-web/components/auth/ClientOnboardingForm.tsx
"use client";

import { useState } from "react";
import { CreateUserInput } from "@mall/types";

interface ClientOnboardingFormProps {
  onSubmit: (data: CreateUserInput) => void;
  isLoading?: boolean;
}

export function ClientOnboardingForm({
  onSubmit,
  isLoading = false,
}: ClientOnboardingFormProps) {
  // [주석] CreateUserInput 타입 규격에 맞춘 폼 입력 상태 초기화
  const [formData, setFormData] = useState<CreateUserInput>({
    recipientName: "",
    phone: "",
    zonecode: "",
    address: "",
    addressDetail: "",
    termsAgreed: false,
    marketingAgreed: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAgreed) {
      alert("이용약관에 동의해야 합니다.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
    >
      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
        Client Onboarding Form
      </h4>

      {/* 수령인 이름 */}
      <div className="flex flex-col gap-1">
        <label className="text-zinc-400">수령인 이름</label>
        <input
          type="text"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleChange}
          placeholder="홍길동"
          required
          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* 연락처 */}
      <div className="flex flex-col gap-1">
        <label className="text-zinc-400">연락처</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="010-0000-0000"
          required
          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* 우편번호 및 주소 */}
      <div className="flex flex-col gap-1">
        <label className="text-zinc-400">우편번호 및 기본 주소</label>
        <div className="flex gap-2">
          <input
            type="text"
            name="zonecode"
            value={formData.zonecode}
            onChange={handleChange}
            placeholder="우편번호"
            required
            className="w-24 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="기본 주소"
            required
            className="flex-1 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* 상세 주소 */}
      <div className="flex flex-col gap-1">
        <label className="text-zinc-400">상세 주소</label>
        <input
          type="text"
          name="addressDetail"
          value={formData.addressDetail}
          onChange={handleChange}
          placeholder="101동 1001호"
          required
          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* 약관 동의 체크박스 */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
        <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            name="termsAgreed"
            checked={formData.termsAgreed}
            onChange={handleChange}
            className="rounded bg-zinc-900 border-zinc-800 text-blue-600 focus:ring-0"
          />
          <span>[필수] 이용약관 및 개인정보 처리방침 동의</span>
        </label>
        <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            name="marketingAgreed"
            checked={formData.marketingAgreed}
            onChange={handleChange}
            className="rounded bg-zinc-900 border-zinc-800 text-blue-600 focus:ring-0"
          />
          <span>[선택] 마케팅 정보 수신 동의</span>
        </label>
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-medium transition-colors"
      >
        {isLoading ? "온보딩 처리 중..." : "온보딩 완료 및 회원가입"}
      </button>
    </form>
  );
}