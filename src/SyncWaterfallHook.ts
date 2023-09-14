import { SyncHook } from "./SyncHook";
import { assert, isPlainObject, checkReturnData } from "./Utils";

export class SyncWaterfallHook<
  T extends Record<any, unknown>,
  C = null
> extends SyncHook<[T], C, T> {
  constructor(context?: C, type = "SyncWaterfallHook") {
    super(context, type);
  }

  emit(data: T) {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`
    );
    for (const fn of this.listeners) {
      const tempData = fn.call(this.context, data);
      assert(
        checkReturnData(data, tempData),
        `The return value of hook "${this.type}" is incorrect.`
      );
      data = tempData;
    }
    return data;
  }
}
