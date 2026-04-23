/**
 * Result<T, E>: 失敗しうる計算の結果を例外ではなく値で表現する。
 * ドメイン層は throw せず、必ず Result を返す（errは具体的な型で）。
 */
export type Ok<T> = { readonly _tag: "ok"; readonly value: T };
export type Err<E> = { readonly _tag: "err"; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ _tag: "ok", value });
export const err = <E>(error: E): Err<E> => ({ _tag: "err", error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r._tag === "ok";
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => r._tag === "err";

export const map = <T, U, E>(r: Result<T, E>, f: (t: T) => U): Result<U, E> =>
  r._tag === "ok" ? ok(f(r.value)) : r;

export const mapErr = <T, E, F>(r: Result<T, E>, f: (e: E) => F): Result<T, F> =>
  r._tag === "err" ? err(f(r.error)) : r;

export const flatMap = <T, U, E>(
  r: Result<T, E>,
  f: (t: T) => Result<U, E>,
): Result<U, E> => (r._tag === "ok" ? f(r.value) : r);

export const unwrapOr = <T, E>(r: Result<T, E>, fallback: T): T =>
  r._tag === "ok" ? r.value : fallback;

export const fromThrowable = <T>(f: () => T): Result<T, Error> => {
  try {
    return ok(f());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

export const fromPromise = async <T>(p: Promise<T>): Promise<Result<T, Error>> => {
  try {
    return ok(await p);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};
