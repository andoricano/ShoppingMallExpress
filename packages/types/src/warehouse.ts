export interface Item {
    uuid: string;
    name: string;
}

export interface InventoryItem extends Item {
    cnt: number;
    meta: InventoryItemMeta;
}

export interface InventoryItemMeta {
    size?: string;
    color?: string;
}