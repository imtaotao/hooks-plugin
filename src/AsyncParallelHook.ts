import { isPromiseLike } from 'aidly';
import { SyncHook } from './SyncHook';
import { createTaskId } from './Utils';
import type { TaskId, ArgsType } from './Interface';

export class AsyncParallelHook<
  T extends Array<unknown>,
  C = null,
> extends SyncHook<T, C, void | Promise<void>> {
  constructor(context?: C) {
    super(context, 'AsyncParallelHook');
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
              map[tag] = Date.now();
            }
            const record = () => {
              if (map && tag) {
                map[tag] = Date.now() - map[tag];
              }
            };
            try {
              const res = fn.apply(this.context, data);
              if (isPromiseLike(res)) {
                // `Thenable` may not provide `catch` method,
                // It needs to be wrapped with a promise.
                return Promise.resolve(res).catch((e) => {
                  record();
                  this._emitError(e, fn, tag);
                  return null;
                });
              } else {
                record();
                return res;
              }
            } catch (e) {
              this._emitError(e, fn, tag);
              return null;
            }
          }),
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
