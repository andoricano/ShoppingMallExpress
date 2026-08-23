import type { MallConfig, ProductCategory } from "@mall/types";

export const MOCK_CATEGORIES: ProductCategory[] = [
  {
    categoryId: "cat-women",
    categoryName: "Women",
    parentId: null,
    depth: 1,
    displayOrder: 1,
    children: [
      {
        categoryId: "cat-women-top",
        categoryName: "Top",
        parentId: "cat-women",
        depth: 2,
        displayOrder: 1,
      },
      {
        categoryId: "cat-women-bottom",
        categoryName: "Bottom",
        parentId: "cat-women",
        depth: 2,
        displayOrder: 2,
      },
      {
        categoryId: "cat-women-outer",
        categoryName: "Outer",
        parentId: "cat-women",
        depth: 2,
        displayOrder: 3,
      },
    ],
  },
  {
    categoryId: "cat-men",
    categoryName: "Men",
    parentId: null,
    depth: 1,
    displayOrder: 2,
    children: [
      {
        categoryId: "cat-men-top",
        categoryName: "Top",
        parentId: "cat-men",
        depth: 2,
        displayOrder: 1,
      },
      {
        categoryId: "cat-men-bottom",
        categoryName: "Bottom",
        parentId: "cat-men",
        depth: 2,
        displayOrder: 2,
      },
      {
        categoryId: "cat-men-outer",
        categoryName: "Outer",
        parentId: "cat-men",
        depth: 2,
        displayOrder: 3,
      },
    ],
  },
  {
    categoryId: "cat-kids",
    categoryName: "Kids",
    parentId: null,
    depth: 1,
    displayOrder: 3,
  },
  {
    categoryId: "cat-lifestyle",
    categoryName: "Lifestyle",
    parentId: null,
    depth: 1,
    displayOrder: 4,
  },
];

export const MOCK_MALL_CONFIG: MallConfig = {
  categories: MOCK_CATEGORIES,
  businessInfo: {
    companyName: "(주)쇼핑몰 컴퍼니",
    representative: "홍길동",
    businessNumber: "123-45-67890",
    mailOrderNumber: "2026-서울강남-00000",
    address: "서울특별시 강남구 테헤란로 123",
    csEmail: "support@mall.com",
    csPhone: "1588-0000",
  },
  mainBanners: [
    {
      id: "banner-1",
      imageUrl: "https://picsum.photos/1200/400",
      title: "2026 S/S Collection Launch",
      subtitle: "신상 라인업을 지금 확인하세요",
      linkUrl: "/products?sort=newest",
    },
  ],
};