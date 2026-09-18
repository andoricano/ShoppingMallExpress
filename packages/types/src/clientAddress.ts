// types/clientAddress.ts

export interface ClientAddress {
    id: string;
    clientId: string;

    label: string | null;

    recipientName: string;
    phone: string;

    zonecode: string;
    address: string;
    addressDetail: string | null;

    isDefault: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface CreateClientAddressInput {
    label?: string | null;

    recipientName: string;
    phone: string;

    zonecode: string;
    address: string;
    addressDetail?: string | null;

    isDefault?: boolean;
}

export interface UpdateClientAddressInput {
    label?: string | null;

    recipientName?: string;
    phone?: string;

    zonecode?: string;
    address?: string;
    addressDetail?: string | null;

    isDefault?: boolean;
}