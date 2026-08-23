import { SITE_CONFIG } from "@/config/site";

export default function Footer() {
  const { company } = SITE_CONFIG;

  return (
    <footer className="bg-neutral-900 text-neutral-400 text-xs border-t border-neutral-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* 사업자 기본 정보 */}
          <div className="space-y-1.5 leading-relaxed">
            <p className="text-sm font-bold text-white mb-2">{company.name}</p>
            <p>대표자: {company.ceo} | 사업자등록번호: {company.businessNumber}</p>
            <p>통신판매업신고: {company.mailOrderNumber}</p>
            <p>주소: {company.address}</p>
          </div>

          {/* CS 센터 정보 */}
          <div className="space-y-1.5 leading-relaxed">
            <p className="text-sm font-bold text-white mb-2">고객센터</p>
            <p className="text-base text-white font-semibold">{company.csPhone}</p>
            <p>이메일: {company.csEmail}</p>
            <p>운영시간: {company.operatingHours}</p>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-800 flex justify-between items-center text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <button type="button" className="hover:underline">이용약관</button>
            <button type="button" className="hover:underline font-bold text-neutral-300">개인정보처리방침</button>
          </div>
        </div>
      </div>
    </footer>
  );
}