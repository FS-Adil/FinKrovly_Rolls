import { api, type RollsApiRow } from '../../api/client';

interface RollsCache {
  data: RollsApiRow[] | null;
  promise: Promise<RollsApiRow[]> | null;
  loadedAt: number | null;
}

const cache: RollsCache = { data: null, promise: null, loadedAt: null };

/**
 * Возвращает данные из кэша или грузит один раз.
 * Параллельные вызовы (например, из StrictMode) дедуплицируются.
 */
export function getRolls(): Promise<RollsApiRow[]> {
  if (cache.data) return Promise.resolve(cache.data);
  if (cache.promise) return cache.promise;

  cache.promise = api.rolls()
    .then(rows => {
      cache.data = rows;
      cache.loadedAt = Date.now();
      return rows;
    })
    .finally(() => {
      cache.promise = null;
    });

  return cache.promise;
}

/** Принудительное обновление: сбрасывает кэш и грузит заново. */
export function refreshRolls(): Promise<RollsApiRow[]> {
  cache.data = null;
  cache.loadedAt = null;
  cache.promise = null;
  return getRolls();
}

/** Полный сброс (например, при logout). */
export function clearRollsCache(): void {
  cache.data = null;
  cache.loadedAt = null;
  cache.promise = null;
}