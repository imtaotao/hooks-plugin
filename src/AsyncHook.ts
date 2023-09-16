import { SyncHook } from "./SyncHook";
import { currentTime, createTaskId } from "./Utils";
import type { TaskId, ArgsType, CallbackReturnType } from "./Interface";

export class AsyncHook<T extends Array<unknown>, C = null> extends SyncHook<
  T,
  C,
  CallbackReturnType<void>
> {
  constructor(context?: C) {
    super(context, "AsyncHook");
  }

  emit(...data: ArgsType<T>): Promise<CallbackReturnType<void>> {
    let id: TaskId;
    let result: any;
    const ls = Array.from(this.listeners);

    let map: Record<string, number> | null = null;

    if (ls.length > 0) {
      id = createTaskId();
      if (!this.after?.isEmpty()) {
        map = Object.create(null);
      }
      this.before?.emit(id, this.type, this.context, data);

      let i = 0;
      const call = (prev?: unknown): unknown => {
        if (prev === false) {
          return false; // Abort process
        } else if (i < ls.length) {
          const fn = ls[i++];
          const tag = this.tags.get(fn);
          if (map && tag) {
            map[tag] = currentTime();
          }
          const res = fn.apply(this.context, data);
          return Promise.resolve(res).then((res) => {
            if (map && tag) {
              map[tag] = currentTime() - map[tag];
            }
            return call(res);
          });
        } else {
          return prev;
        }
      };
      result = call();
    }

    return Promise.resolve(result).then((result) => {
      if (ls.length > 0) {
        // The data being mapped will only be meaningful if `after` is not empty.
        this.after?.emit(id, this.type, this.context, data, map!);
      }
      return result;
    });
  }
}
