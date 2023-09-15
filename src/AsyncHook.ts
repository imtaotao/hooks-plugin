import { SyncHook } from "./SyncHook";
import { createTaskId } from "./Utils";
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

    if (ls.length > 0) {
      id = createTaskId();
      this.before?.emit(id, this.type, this.context, data);
      let i = 0;
      const call = (prev?: unknown): unknown => {
        if (prev === false) {
          return false; // Abort process
        } else if (i < ls.length) {
          return Promise.resolve(ls[i++].apply(this.context, data)).then(call);
        } else {
          return prev;
        }
      };
      result = call();
    }

    return Promise.resolve(result).then((result) => {
      if (ls.length > 0) {
        this.after?.emit(id, this.type, this.context, data);
      }
      return result;
    });
  }
}
