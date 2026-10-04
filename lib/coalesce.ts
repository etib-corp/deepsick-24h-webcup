/** Share simultaneous identical reads until they settle; never retain a result. */
export function coalesce<Args extends unknown[], Result>(read: (...args: Args) => Promise<Result>) {
  const pending = new Map<string, Promise<Result>>();
  return (...args: Args): Promise<Result> => {
    const key = JSON.stringify(args);
    const existing = pending.get(key);
    if (existing) return existing;
    const result = Promise.resolve().then(() => read(...args)).finally(() => pending.delete(key));
    pending.set(key, result);
    return result;
  };
}
