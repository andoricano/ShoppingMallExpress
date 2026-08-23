import { MOCK_MALL_CONFIG } from "@/mock/mockCategory";
import { MallConfig } from "@mall/types";
import { create } from "zustand";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface MallConfigState {
  config: MallConfig;
  loading: boolean;
  error: string | null;
  /** 서버에서 최신 쇼핑몰 설정(카테고리, 사업자정보 등)을 로드 */
  fetchMallConfig: () => Promise<void>;
}

export const useMallConfigStore = create<MallConfigState>((set) => ({
  config: MOCK_MALL_CONFIG,
  loading: false,
  error: null,

  fetchMallConfig: async () => {
    set({ loading: true, error: null });
    try {
      // 💡 관리자가 수정한 서버 최신 Config 불러오기
      const response = await fetch(`${API_BASE_URL}/api/config/client`).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        set({ config: data.data || data, loading: false });
      } else {
        // 서버 연결 실패 시 Mock 유지
        set({ loading: false });
      }
    } catch (err) {
      console.error("❌ [useMallConfigStore] fetchMallConfig 실패:", err);
      set({ error: "설정 정보를 불러오지 못했습니다.", loading: false });
    }
  },
}));