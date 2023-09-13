import { SyncHook } from "./SyncHook";
import type { ArgsType, CallbackReturnType } from "./Interface";

export class AsyncHook<T, K = CallbackReturnType<void>> extends SyncHook<
  T,
  CallbackReturnType<void> | Promise<K>
> {
  constructor(type = "AsyncHook") {
    super(type);
  }

  emit(...data: ArgsType<T>): Promise<void | false | K> {
    let result;
    const ls = Array.from(this.listeners);
    if (ls.length > 0) {
      let i = 0;
      const call = (prev?: unknown) => {
        if (prev === false) {
          return false; // Abort process
        } else if (i < ls.length) {
          return Promise.resolve(ls[i++].apply(null, data)).then(call);
        } else {
          return prev;
        }
      };
      result = call();
    }
    return Promise.resolve(result);
  }
}
