import { SyncHook } from "./SyncHook";
import { assert, isPlainObject, checkReturnData } from "./Utils";
import type { CallbackReturnType } from "./Interface";

export class AsyncWaterfallHook<
  T extends Record<any, unknown>,
  C = null
> extends SyncHook<[T], C, CallbackReturnType<T>> {
  constructor(context?: C, type = "AsyncWaterfallHook") {
    super(context, type);
  }

  emit(data: T): Promise<T | false> {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`
    );
    const ls = Array.from(this.listeners);
    if (ls.length === 0) {
      return Promise.resolve(data);
    }

    let i = 0;
    const call = (prevData: T | false): any => {
      if (prevData === false) {
        return false;
      } else {
        assert(
          checkReturnData(data, prevData),
          `The return value of hook "${this.type}" is incorrect.`
        );
        data = prevData as T;
        if (i < ls.length) {
          return Promise.resolve(ls[i++].call(this.context, data)).then(call);
        }
      }
      return data;
    };
    return Promise.resolve(call(data));
  }
}
