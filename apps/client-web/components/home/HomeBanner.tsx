import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative w-full h-[500px] bg-neutral-900 text-white flex items-center justify-center">
      <div className="text-center px-4 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          일상에 특별함을 더하는 선택
        </h1>
        <p className="text-lg text-neutral-300 mb-8 font-light">
          브랜드의 가치를 담아낸 시그니처 컬렉션을 만나보세요.
        </p>
        <Link
          href="/products"
          className="inline-block bg-white text-black font-medium px-8 py-3.5 hover:bg-neutral-200 transition-colors"
        >
          지금 둘러보기
        </Link>
      </div>
    </section>
  );
}