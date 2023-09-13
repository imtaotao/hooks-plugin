import { SyncHook } from "./SyncHook";
import { assert, isPlainObject, checkReturnData } from "./Utils";

export class SyncWaterfallHook<T extends Record<string, any>> extends SyncHook<
  [T],
  T
> {
  constructor(type = "SyncWaterfallHook") {
    super(type);
  }

  emit(data: T) {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`
    );
    for (const fn of this.listeners) {
      const tempData = fn(data);
      assert(
        checkReturnData(data, tempData),
        `The return value of hook "${this.type}" is incorrect.`
      );
      data = tempData;
    }
    return data;
  }
}
