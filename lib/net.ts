/** AbortSignal.timeout with a fallback for runtimes that do not implement it. */
export function timeoutSignal(ms: number): AbortSignal {
  const timeoutFn = (AbortSignal as unknown as { timeout?: (n: number) => AbortSignal }).timeout;
  if (typeof timeoutFn === 'function') {
    return timeoutFn(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
