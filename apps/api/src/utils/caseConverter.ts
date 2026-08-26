// utils/caseConverter.ts

// --- Types ---
type CamelCase<S extends string> = S extends `${infer T}_${infer U}`
    ? `${T}${Capitalize<CamelCase<U>>}`
    : S;

export type KeysToCamelCase<T> = T extends Array<infer U>
    ? Array<KeysToCamelCase<U>>
    : T extends object
    ? { [K in keyof T as CamelCase<Extract<K, string>>]: KeysToCamelCase<T[K]> }
    : T;

type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
    ? `${T extends Uppercase<T> ? `_${Lowercase<T>}` : T}${SnakeCase<U>}`
    : S;

export type KeysToSnakeCase<T> = T extends Array<infer U>
    ? Array<KeysToSnakeCase<U>>
    : T extends object
    ? { [K in keyof T as SnakeCase<Extract<K, string>>]: KeysToSnakeCase<T[K]> }
    : T;

// --- Functions ---

/**
 * DB 조회 결과 (snake_case) -> Express / Client 응답 (camelCase)
 */
export function toCamelCase<T>(obj: any): KeysToCamelCase<T> {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamelCase(v)) as any;
    }
    
    if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z0-9])/gi, (_, letter) => letter.toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    
    return obj;
}

/**
 * Express / Client 요청 Payload (camelCase) -> Supabase DB 요청 (snake_case)
 */
export function toSnakeCase<T>(obj: any): KeysToSnakeCase<T> {
    if (Array.isArray(obj)) {
        return obj.map((v) => toSnakeCase(v)) as any;
    }
    
    if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            // camelCase -> snake_case 변환 (ex: adminId -> admin_id, optionName2 -> option_name2)
            const snakeKey = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
            result[snakeKey] = toSnakeCase(obj[key]);
            return result;
        }, {} as any);
    }
    
    return obj;
}