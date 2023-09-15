import { SyncHook } from "./SyncHook";
import { assert, isPlainObject, checkReturnData } from "./Utils";

export class SyncWaterfallHook<
  T extends Record<any, unknown>,
  C = null
> extends SyncHook<[T], C, T> {
  constructor(context?: C) {
    super(context, "SyncWaterfallHook");
  }

  emit(data: T) {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`
    );
    if (this.listeners.size > 0) {
      this.before?.emit(this.type, this.context, [data]);
      for (const fn of this.listeners) {
        const tempData = fn.call(this.context, data);
        assert(
          checkReturnData(data, tempData),
          `The return value of hook "${this.type}" is incorrect.`
        );
        data = tempData;
      }
      this.after?.emit(this.type, this.context, [data]);
    }
    return data;
  }
}
