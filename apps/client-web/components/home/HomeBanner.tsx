import { HeroSection } from "@mall/types";
import Link from "next/link";

interface HeroBannerProps {
    section: HeroSection;
}

export default function HeroBanner({
    section,
}: HeroBannerProps) {
    return (
        <section className="relative flex h-[500px] w-full items-center justify-center overflow-hidden bg-neutral-900 text-white">
            {/* 배경 이미지 */}
            {section.imageUrl && (
                <img
                    src={section.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative z-10 max-w-2xl px-4 text-center">
                {section.title && (
                    <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {section.title}
                    </h1>
                )}

                {section.description && (
                    <p className="mb-8 text-lg font-light text-neutral-200">
                        {section.description}
                    </p>
                )}

                {section.productId && (
                    <Link
                        href={`/products/${section.productId}`}
                        className="inline-block bg-white px-8 py-3.5 font-medium text-black transition-colors hover:bg-neutral-200"
                    >
                        지금 둘러보기
                    </Link>
                )}
            </div>
        </section>
    );
}