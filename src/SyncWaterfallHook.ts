import { assert, isPlainObject } from 'aidly';
import { SyncHook } from './SyncHook';
import { createTaskId, checkReturnData } from './Utils';

export class SyncWaterfallHook<
  T extends Record<any, unknown>,
  C = null,
> extends SyncHook<[T], C, T> {
  constructor(context?: C) {
    super(context, 'SyncWaterfallHook');
  }

  emit(data: T) {
    assert(
      isPlainObject(data),
      `"${this.type}" hook response data must be an object.`,
    );
    if (this.listeners.size > 0) {
      const id = createTaskId();
      let map: Record<string, number> | null = null;
      if (!this.after?.isEmpty()) {
        map = Object.create(null);
      }
      this.before?.emit(id, this.type, this.context, [data]);

      for (const fn of this.listeners) {
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
          const tempData = fn.call(this.context, data);
          assert(
            checkReturnData(data, tempData),
            `The return value of hook "${this.type}" is incorrect.`,
          );
          data = tempData;
          record();
        } catch (e) {
          record();
          this._emitError(e, fn, tag);
        }
      }
      this.after?.emit(id, this.type, this.context, [data], map!);
    }
    return data;
  }
}
