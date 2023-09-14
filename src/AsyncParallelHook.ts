import { SyncHook } from "./SyncHook";
import type { ArgsType } from "./Interface";
export class AsyncParallelHook<T, C = null> extends SyncHook<
  T,
  C,
  void | Promise<void>
> {
  constructor(context?: C, type = "AsyncParallelHook") {
    super(context, type);
  }

  emit(...data: ArgsType<T>) {
    const taskList: Array<unknown> = [];
    for (const fn of this.listeners) {
      taskList.push(Promise.resolve().then(() => fn.apply(this.context, data)));
    }
    return Promise.all(taskList).then(() => {});
  }
}
