import { SyncHook } from "./SyncHook";
import { createTaskId } from "./Utils";
import type { TaskId, ArgsType } from "./Interface";

export class AsyncParallelHook<
  T extends Array<unknown>,
  C = null
> extends SyncHook<T, C, void | Promise<void>> {
  constructor(context?: C) {
    super(context, "AsyncParallelHook");
  }

  emit(...data: ArgsType<T>) {
    let id: TaskId;
    const taskList: Array<unknown> = [];
    // Disclaimer in advance, `listeners` may change
    const size = this.listeners.size;

    if (size > 0) {
      id = createTaskId();
      this.before?.emit(id, this.type, this.context, data);
      for (const fn of this.listeners) {
        taskList.push(
          Promise.resolve().then(() => fn.apply(this.context, data))
        );
      }
    }
    return Promise.all(taskList).then(() => {
      if (size > 0) {
        this.after?.emit(id, this.type, this.context, data);
      }
    });
  }
}
