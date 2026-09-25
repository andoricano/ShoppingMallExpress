export type UserRole =
    | "CLIENT"
    | "ADMIN";

export interface BaseProfile {
    id: string;
    name?: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

export interface ClientProfile
    extends BaseProfile {
    role: "CLIENT";

    recipientName?: string;
    phone?: string;

    isOnboarded: boolean;
}

export interface AdminProfile
    extends BaseProfile {
    role: "ADMIN";
    department?: string;
}

export type UserProfile =
    | ClientProfile
    | AdminProfile;

export interface CreateUserInput {
    recipientName: string;
    phone: string;
    zonecode: string;
    address: string;
    addressDetail: string;
    termsAgreed: boolean;
    marketingAgreed?: boolean;
}
