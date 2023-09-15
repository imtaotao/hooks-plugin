import { SyncHook } from "./SyncHook";
import type { ArgsType } from "./Interface";
export class AsyncParallelHook<
  T extends Array<unknown>,
  C = null
> extends SyncHook<T, C, void | Promise<void>> {
  constructor(context?: C) {
    super(context, "AsyncParallelHook");
  }

  emit(...data: ArgsType<T>) {
    const taskList: Array<unknown> = [];
    // Disclaimer in advance, `listeners` may change
    const size = this.listeners.size;

    if (size > 0) {
      this.before?.emit(this.type, this.context, data);
      for (const fn of this.listeners) {
        taskList.push(
          Promise.resolve().then(() => fn.apply(this.context, data))
        );
      }
    }
    return Promise.all(taskList).then(() => {
      if (size > 0) {
        this.after?.emit(this.type, this.context, data);
      }
    });
  }
}
