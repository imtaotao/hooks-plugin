import { SyncHook } from "./SyncHook";
import {
  assert,
  currentTime,
  createTaskId,
  isPlainObject,
  checkReturnData,
} from "./Utils";
import type { TaskId, CallbackReturnType } from "./Interface";

export class AsyncWaterfallHook<
  T extends Record<any, unknown>,
  C = null
> extends SyncHook<[T], C, CallbackReturnType<T>> {
  constructor(context?: C) {
    super(context, "AsyncWaterfallHook");
  }

  emit(data: T): Promise<T | false> {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`
    );
    let i = 0;
    let id: TaskId;
    let map: Record<string, number> | null = null;
    const ls = Array.from(this.listeners);

    if (ls.length > 0) {
      id = createTaskId();
      if (!this.after?.isEmpty()) {
        map = Object.create(null);
      }
      this.before?.emit(id, this.type, this.context, [data]);

      const call = (prevData: T | false): any => {
        if (prevData === false) {
          return false;
        } else {
          assert(
            checkReturnData(data, prevData),
            `The return value of hook "${this.type}" is incorrect.`
          );
          data = prevData as T;
          if (i < ls.length) {
            const fn = ls[i++];
            const tag = this.tags.get(fn);
            if (map && tag) {
              map[tag] = currentTime();
            }
            return Promise.resolve(fn.call(this.context, data)).then((res) => {
              if (map && tag) {
                map[tag] = currentTime() - map[tag];
              }
              return call(res);
            });
          }
        }
        return data;
      };

      return Promise.resolve(call(data)).then((data) => {
        this.after?.emit(id, this.type, this.context, [data], map!);
        return data;
      });
    } else {
      return Promise.resolve(data);
    }
  }
}
