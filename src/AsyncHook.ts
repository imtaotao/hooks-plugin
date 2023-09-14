import { SyncHook } from "./SyncHook";
import type { ArgsType, CallbackReturnType } from "./Interface";

export class AsyncHook<T, C = null> extends SyncHook<
  T,
  C,
  CallbackReturnType<void>
> {
  constructor(context?: C, type = "AsyncHook") {
    super(context, type);
  }

  emit(...data: ArgsType<T>): Promise<CallbackReturnType<void>> {
    let result: any;
    const ls = Array.from(this.listeners);
    if (ls.length > 0) {
      let i = 0;
      const call = (prev?: unknown): unknown => {
        if (prev === false) {
          return false; // Abort process
        } else if (i < ls.length) {
          return Promise.resolve(ls[i++].apply(this.context, data)).then(call);
        } else {
          return prev;
        }
      };
      result = call();
    }
    return Promise.resolve(result);
  }
}
