// types/clientAddress.ts

export interface ClientAddress {
    id: string;
    clientId: string;

    label?: string;

    recipientName: string;
    phone: string;

    zonecode: string;
    address: string;
    addressDetail?: string;

    isDefault: boolean;

    createdAt: string;
    updatedAt: string;
}


export interface CreateClientAddressInput {
    label?: string;

    recipientName: string;
    phone: string;

    zonecode: string;
    address: string;
    addressDetail?: string;

    isDefault?: boolean;
}

export interface UpdateClientAddressInput {
    label?: string;

    recipientName?: string;
    phone?: string;

    zonecode?: string;
    address?: string;
    addressDetail?: string;

    isDefault?: boolean;
}