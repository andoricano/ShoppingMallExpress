// constants/configConstant.ts

export const PAGE_CONFIG_KEYS = {
    MAIN_PAGE: "main_page",
    CLOUDINARY: "cloudinary",
    PAYMENT: "payment",
    EXTERNAL_SERVICES: "external_services",
} as const;

export type PageConfigKey =
    (typeof PAGE_CONFIG_KEYS)[keyof typeof PAGE_CONFIG_KEYS];