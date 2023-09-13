import { SyncHook } from "./SyncHook";
import { assert, isPlainObject } from "./Utils";

export class AsyncParallelHook<T extends Record<string, any>> extends SyncHook<
  [T],
  void
> {
  constructor(type = "AsyncParallelHook") {
    super(type);
  }

  emit(data: T) {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`
    );
    const taskList: Array<unknown> = [];
    for (const fn of this.listeners) {
      taskList.push(Promise.resolve(data).then(fn));
    }
    return Promise.all(taskList).then(() => data);
  }
}
