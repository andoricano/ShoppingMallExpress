import type { ClientPageConfig } from "@mall/types";

export const configData: ClientPageConfig = {
    id: "main",

    header: {
        isActive: true,
        menuIds: ["menu-1", "menu-2", "menu-3"],
    },

    hero: [
        {
            id: "hero-1",
            order: 1,
            isActive: true,
            productId: "product-1",
            imageUrl: "/images/hero-summer.jpg",
            title: "여름 신상품",
            description: "새로운 계절을 위한 시그니처 컬렉션을 만나보세요.",
        },
        {
            id: "hero-2",
            order: 2,
            isActive: true,
            productId: "product-5",
            imageUrl: "/images/hero-new.jpg",
            title: "새로운 시작",
            description: "일상에 특별함을 더하는 새로운 상품을 만나보세요.",
        },
    ],

    sections: [
        {
            id: "section-featured",
            type: "PRODUCT",
            order: 1,
            isActive: true,
            title: "대표 상품",
            productIds: [
                "product-1",
                "product-2",
                "product-3",
                "product-4",
            ],
            layout: "GRID",
        },
        {
            id: "section-new",
            type: "PRODUCT",
            order: 2,
            isActive: true,
            title: "신상품",
            productIds: [
                "product-5",
                "product-6",
                "product-7",
                "product-8",
            ],
            layout: "HORIZONTAL_SCROLL",
        },
        {
            id: "section-category",
            type: "CATEGORY",
            order: 3,
            isActive: true,
            categoryIds: [
                "category-shoes",
                "category-clothing",
                "category-accessories",
            ],
        },
        {
            id: "section-banner",
            type: "BANNER",
            order: 4,
            isActive: true,
            imageUrl: "/images/banner-event.jpg",
            title: "시즌 오프 이벤트",
            description: "지금만 만나볼 수 있는 특별한 혜택",
            link: "/events/summer",
        },
    ],

    footer: {
        isActive: true,

        businessName: "Example Company",
        representativeName: "홍길동",
        businessNumber: "000-00-00000",

        address: "서울특별시 강남구 테헤란로 123",

        customerCenter: "1588-0000",
        additionalInfo: "평일 09:00 ~ 18:00",
    },
};