import { now, assert, isPlainObject } from 'aidly';
import { SyncHook } from './SyncHook';
import { createTaskId, checkReturnData } from './Utils';
import type { TaskId, CallbackReturnType } from './Interface';

export class AsyncWaterfallHook<
  T extends Record<any, unknown>,
  C = null,
> extends SyncHook<[T], C, CallbackReturnType<T>> {
  constructor(context?: C) {
    super(context, 'AsyncWaterfallHook');
  }

  emit(data: T): Promise<T | false> {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`,
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

      const call = (prev: T | false): any => {
        if (prev === false) {
          return false;
        } else {
          assert(
            checkReturnData(data, prev),
            `The return value of hook "${this.type}" is incorrect.`,
          );
          data = prev as T;
          if (i < ls.length) {
            let res: CallbackReturnType<T>;
            const fn = ls[i++];
            const tag = this.tags.get(fn);
            if (map && tag) {
              map[tag] = now();
            }
            const record = () => {
              if (map && tag) {
                map[tag] = now() - map[tag];
              }
            };
            try {
              res = fn.call(this.context, prev);
            } catch (e) {
              // If there is an error in the function call,
              // there is no need to monitor the result of the promise.
              record();
              this._emitError(e, fn, tag);
              return call(prev);
            }
            return Promise.resolve(res)
              .finally(record)
              .then(call)
              .catch((e) => {
                this._emitError(e, fn, tag);
                return call(prev);
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
