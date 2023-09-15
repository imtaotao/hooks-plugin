import { assert, INTERNAL, createTaskId } from "./Utils";
import type { TaskId, ArgsType, Callback, HookType } from "./Interface";

export class SyncHook<T extends Array<unknown>, C = null, K = void> {
  public context: C;
  public type: HookType;
  public listeners = new Set<Callback<T, C, K>>();
  public before?: SyncHook<[TaskId, HookType, C, ArgsType<T>]>;
  public after?: SyncHook<[TaskId, HookType, C, ArgsType<T>]>;

  // Only `context` is allowed to be passed in from outside
  constructor(context?: C, _type: HookType = "SyncHook", _internal?: Symbol) {
    this.type = _type;
    this.context = typeof context === "undefined" ? (null as any) : context;
    if (_internal !== INTERNAL) {
      this.before = new SyncHook(null, "SyncHook", INTERNAL);
      this.after = new SyncHook(null, "SyncHook", INTERNAL);
    }
  }

  /**
   * Register a hook.
   */
  on(fn: Callback<T, C, K>) {
    assert(typeof fn === "function", `Invalid parameter in "${this.type}".`);
    this.listeners.add(fn);
  }

  /**
   * Register a single-use hook.
   */
  once(fn: Callback<T, C, K>) {
    const self = this;
    this.on(function wrapper(...args: Array<unknown>) {
      self.remove(wrapper);
      return fn.apply(this, args as any);
    });
  }

  /**
   * trigger hooks.
   */
  emit(...data: ArgsType<T>) {
    if (this.listeners.size > 0) {
      const id = createTaskId();
      this.before?.emit(id, this.type, this.context, data);
      this.listeners.forEach((fn) => fn.apply(this.context, data));
      this.after?.emit(id, this.type, this.context, data);
    }
  }

  /**
   * Remove all hooks.
   */
  remove(fn: Callback<T, C, K>) {
    return this.listeners.delete(fn);
  }

  /**
   * Remove a specific hook.
   */
  removeAll() {
    this.listeners.clear();
  }

  /**
   *  Clone a clean instance.
   */
  clone() {
    return new (this.constructor as any)(
      this.context,
      this.type,
      this.before ? null : INTERNAL
    ) as this;
  }
}
