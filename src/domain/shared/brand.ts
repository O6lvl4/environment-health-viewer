/**
 * Branded type utility. プリミティブ型にコンパイル時のみのタグを付与し、
 * 同じ`number`でも意味が違うものを型レベルで区別する。
 *
 * ```ts
 * type Hpa = Brand<number, "Hpa">;
 * const p: Hpa = 1013 as Hpa;  // 構築は as で
 * ```
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };
