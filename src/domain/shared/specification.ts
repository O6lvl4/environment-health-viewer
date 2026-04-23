/**
 * Specification パターン (Evans, DDD)。
 * 「ある対象が条件を満たすか」の述語を一級市民として扱い、合成可能にする。
 */
export type Specification<T> = (subject: T) => boolean;

export const and = <T>(...specs: ReadonlyArray<Specification<T>>): Specification<T> =>
  (s) => specs.every((spec) => spec(s));

export const or = <T>(...specs: ReadonlyArray<Specification<T>>): Specification<T> =>
  (s) => specs.some((spec) => spec(s));

export const not = <T>(spec: Specification<T>): Specification<T> => (s) => !spec(s);
