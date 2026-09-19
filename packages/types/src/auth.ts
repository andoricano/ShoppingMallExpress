import type { Point } from "./point.js";

// 1. 역할(Role) 타입 정의

export type UserRole =
    | "CLIENT"
    | "ADMIN";

// 2. 공통 프로필 인터페이스

export interface BaseProfile {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

// 3. Client(일반 고객) 전용 프로필

export interface ClientProfile
    extends BaseProfile {
    role: "CLIENT";

    recipientName?: string;

    phone?: string;

    address?: {
        zonecode: string;
        address: string;
        detail: string;
    };

    isOnboarded: boolean;

    point?: Point;
}

// 4. Admin(관리자) 전용 프로필

export interface AdminProfile
    extends BaseProfile {
    role: "ADMIN";

    department?: string;
}

export type UserProfile =
    | ClientProfile
    | AdminProfile;

// 6. Client 온보딩 폼 제출용 데이터 타입

export interface CreateUserInput {
    recipientName: string;

    phone: string;

    zonecode: string;

    address: string;

    addressDetail: string;

    termsAgreed: boolean;

    marketingAgreed?: boolean;
}