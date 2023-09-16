import { SyncHook } from "./SyncHook";
import { currentTime, createTaskId } from "./Utils";
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
    let map: Record<string, number> | null = null;
    // Disclaimer in advance, `listeners` may change
    const size = this.listeners.size;
    const taskList: Array<unknown> = [];

    if (size > 0) {
      id = createTaskId();
      if (!this.after?.isEmpty()) {
        map = Object.create(null);
      }
      this.before?.emit(id, this.type, this.context, data);

      for (const fn of this.listeners) {
        taskList.push(
          Promise.resolve().then(() => {
            const tag = this.tags.get(fn);
            if (map && tag) {
              map[tag] = currentTime();
            }
            const res = fn.apply(this.context, data);
            if (map && tag) {
              map[tag] = currentTime() - map[tag];
            }
            return res;
          })
        );
      }
    }
    return Promise.all(taskList).then(() => {
      if (size > 0) {
        this.after?.emit(id, this.type, this.context, data, map!);
      }
    });
  }
}
