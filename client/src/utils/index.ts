export type AnyFunction<TArgs extends any[] = any[], TResult = any> = (...args: TArgs) => TResult;

// timingFunction: Debounces a function so it's called after `waitMs` of inactivity
// Returns a wrapped function and a cancel method
export function timingFunction<TArgs extends any[]>(fn: AnyFunction<TArgs, void | Promise<void>>, waitMs = 400) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return wrapped as AnyFunction<TArgs, void> & { cancel: () => void };
}


