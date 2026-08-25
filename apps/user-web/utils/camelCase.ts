type CamelCase<S extends string> = S extends `${infer T}_${infer U}`
    ? `${T}${Capitalize<CamelCase<U>>}`
    : S;

export type KeysToCamelCase<T> = T extends Array<infer U>
    ? Array<KeysToCamelCase<U>>
    : T extends object
    ? { [K in keyof T as CamelCase<Extract<K, string>>]: KeysToCamelCase<T[K]> }
    : T;

/**
 * 스네이크케이스(snake_case) 키를 카멜케이스(camelCase)로 변환
 */
export function toCamelCase<T>(obj: any): KeysToCamelCase<T> {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamelCase(v)) as any;
    }
    if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
}