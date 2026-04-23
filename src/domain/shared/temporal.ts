/**
 * 時系列インデックス操作のドメインヘルパ。
 * 「現在時刻に最も近い1時間スロットのインデックス」のような汎用操作を提供する。
 */

export const nearestHourIndex = (
  times: ReadonlyArray<string>,
  now: Date,
): number => {
  if (times.length === 0) return -1;
  const target = now.getTime();
  let bestIdx = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
};

/**
 * 配列の安全なスライス。境界チェック付き。
 */
export const safeSlice = <T>(
  arr: ReadonlyArray<T>,
  start: number,
  end: number,
): ReadonlyArray<T> => arr.slice(Math.max(0, start), Math.min(arr.length, end));
