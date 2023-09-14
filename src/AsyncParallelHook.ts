import { SyncHook } from "./SyncHook";
import { assert, isPlainObject } from "./Utils";

export class AsyncParallelHook<
  T extends Record<any, unknown>,
  C = null
> extends SyncHook<[T], C, void | Promise<void>> {
  constructor(context?: C, type = "AsyncParallelHook") {
    super(context, type);
  }

  emit(data: T) {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`
    );
    const taskList: Array<unknown> = [];
    for (const fn of this.listeners) {
      taskList.push(
        Promise.resolve(data).then((res) => fn.call(this.context, res))
      );
    }
    return Promise.all(taskList).then(() => data);
  }
}
