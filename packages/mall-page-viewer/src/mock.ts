// packages/mall-page-viewer/src/mainPage.mock.ts

import { PageConfig } from "./types/mainPage";



export const mainPageMock: PageConfig = {
    id: "main-page-001",

    // ==========================================
    // Header
    // ==========================================

    header: {
        isActive: true,

        menuIds: [
            "menu-1",
            "menu-2",
            "menu-3",
        ],
    },

    // ==========================================
    // Hero
    // ==========================================

    hero: [
        {
            id: "hero-1",

            imageUrl:
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8",

            title: "새로운 시즌을 만나보세요",

            description:
                "MALL의 새로운 상품을 지금 확인해보세요.",

            relativePath: "/products",

            order: 0,
            isActive: true,
        },
    ],

    // ==========================================
    // Sections
    // ==========================================

    sections: [
        // --------------------------------------
        // Product Section
        // --------------------------------------

        {
            id: "product-section-1",

            type: "PRODUCT",

            title: "추천 상품",

            products: [
                {
                    id: "product-1",

                    imageUrl:
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",

                    title: "베이직 티셔츠",

                    summary:
                        "매일 편하게 착용할 수 있는 기본 티셔츠입니다.",

                    price: 29900,

                    discount: 19900,

                    tags: [
                        "BEST",
                        "SALE",
                    ],
                },

                {
                    id: "product-2",

                    imageUrl:
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff",

                    title: "데일리 스니커즈",

                    summary:
                        "깔끔한 디자인의 데일리 스니커즈입니다.",

                    price: 89000,

                    discount: 69000,

                    tags: [
                        "NEW",
                    ],
                },

                {
                    id: "product-3",

                    imageUrl:
                        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3",

                    title: "오버핏 셔츠",

                    summary:
                        "여유로운 실루엣의 베이직 오버핏 셔츠.",

                    price: 49900,

                    tags: [
                        "BASIC",
                    ],
                },

                {
                    id: "product-4",

                    imageUrl:
                        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105",

                    title: "캐주얼 니트",

                    summary:
                        "부드러운 소재로 제작된 데일리 니트입니다.",

                    price: 59900,

                    discount: 44900,

                    tags: [
                        "SALE",
                    ],
                },
            ],

            layout: "GRID",

            cardType: "DISCOUNT",

            order: 0,
            isActive: true,
        },

        // --------------------------------------
        // Promotion Section
        // --------------------------------------

        {
            id: "promotion-section-1",

            type: "PROMOTION",

            title: "지금 진행 중인 프로모션",

            promotions: [
                {
                    id: "promotion-1",

                    imageUrl:
                        "https://images.unsplash.com/photo-1607083206869-4c7672e72a8e",

                    title: "여름 시즌 세일",

                    description:
                        "인기 상품을 특별한 가격으로 만나보세요.",

                    relativePath:
                        "/products?sale=true",
                },

                {
                    id: "promotion-2",

                    imageUrl:
                        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",

                    title: "신상품 출시",

                    description:
                        "이번 시즌 새롭게 출시된 상품을 확인해보세요.",

                    relativePath:
                        "/products?new=true",
                },

                {
                    id: "promotion-3",

                    imageUrl:
                        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",

                    title: "주말 특별 혜택",

                    description:
                        "이번 주말 동안만 제공되는 특별 혜택.",

                    relativePath:
                        "/promotion/weekend",
                },
            ],

            order: 1,
            isActive: true,
        },

        // --------------------------------------
        // Detailed Product Section
        // --------------------------------------

        {
            id: "product-section-2",

            type: "PRODUCT",

            title: "상품 자세히 보기",

            products: [
                {
                    id: "product-5",

                    imageUrl:
                        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b",

                    title: "시즌 컬렉션 재킷",

                    summary:
                        "이번 시즌을 위해 디자인된 재킷입니다. 다양한 스타일과 자연스럽게 어울리며 데일리부터 특별한 날까지 활용할 수 있습니다.",

                    price: 129000,

                    discount: 99000,

                    tags: [
                        "NEW",
                        "COLLECTION",
                    ],
                },

                {
                    id: "product-6",

                    imageUrl:
                        "https://images.unsplash.com/photo-1483985988355-763728e1935b",

                    title: "베이직 데님",

                    summary:
                        "다양한 상의와 쉽게 매치할 수 있는 클래식한 데님 팬츠입니다.",

                    price: 79900,

                    tags: [
                        "BEST",
                    ],
                },
            ],

            layout: "LARGE",

            cardType: "DETAILED",

            order: 2,
            isActive: true,
        },
    ],

    // ==========================================
    // Footer
    // ==========================================

    footer: {
        isActive: true,

        businessName: "MALL",

        representativeName:
            "홍길동",

        businessNumber:
            "123-45-67890",

        address:
            "서울특별시 강남구 테헤란로 123",

        customerCenter:
            "02-1234-5678",

        additionalInfo:
            "평일 09:00 ~ 18:00 / 점심시간 12:00 ~ 13:00",
    },
};