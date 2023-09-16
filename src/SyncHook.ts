import { assert, INTERNAL, currentTime, createTaskId } from "./Utils";
import type { TaskId, ArgsType, Callback, HookType } from "./Interface";

export class SyncHook<T extends Array<unknown>, C = null, K = void> {
  public context: C;
  public type: HookType;
  public listeners = new Set<Callback<T, C, K>>();
  public tags = new WeakMap<Callback<T, C, K>, string>();
  public before?: SyncHook<[TaskId, HookType, C, ArgsType<T>]>;
  public after?: SyncHook<
    [TaskId, HookType, C, ArgsType<T>, Record<string, number>]
  >;

  // Only `context` is allowed to be passed in from outside
  constructor(context?: C, _type: HookType = "SyncHook", _internal?: Symbol) {
    this.type = _type;
    this.context = typeof context === "undefined" ? (null as any) : context;

    // `before` and `after` hooks should not call other `before` and `after` hooks recursively,
    // as it can lead to infinite loops.
    if (_internal !== INTERNAL) {
      this.before = new SyncHook(null, "SyncHook", INTERNAL);
      this.after = new SyncHook(null, "SyncHook", INTERNAL);
    }
  }

  /**
   * Register a hook.
   */
  on(fn: Callback<T, C, K>): void;
  on(tag: string, fn: Callback<T, C, K>): void;
  on(tag: string | Callback<T, C, K>, fn?: Callback<T, C, K>) {
    if (typeof tag === "function") {
      fn = tag;
      tag = "";
    }
    assert(typeof fn === "function", `Invalid parameter in "${this.type}".`);
    if (tag && typeof tag === "string") {
      this.tags.set(fn as Callback<T, C, K>, tag);
    }
    this.listeners.add(fn as Callback<T, C, K>);
  }

  /**
   * Register a single-use hook.
   */
  once(fn: Callback<T, C, K>): void;
  once(tag: string, fn: Callback<T, C, K>): void;
  once(tag: string | Callback<T, C, K>, fn?: Callback<T, C, K>) {
    if (typeof tag === "function") {
      fn = tag;
      tag = "";
    }
    const self = this;
    this.on(tag, function wrapper(...args: Array<unknown>) {
      self.remove(wrapper);
      return (fn as Callback<T, C, K>).apply(this, args as any);
    });
  }

  /**
   * trigger hooks.
   */
  emit(...data: ArgsType<T>) {
    if (this.listeners.size > 0) {
      const id = createTaskId();
      let map: Record<string, number> | null = null;
      if (!this.after?.isEmpty()) {
        map = Object.create(null);
      }
      this.before?.emit(id, this.type, this.context, data);

      this.listeners.forEach((fn) => {
        const tag = this.tags.get(fn);
        if (map && tag) {
          map[tag] = currentTime();
        }
        const res = fn.apply(this.context, data);
        if (map && tag) {
          map[tag] = currentTime() - map[tag];
        }
        return res;
      });
      // The data being mapped will only be meaningful if `after` is not empty.
      this.after?.emit(id, this.type, this.context, data, map!);
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
   * Determine whether there is an executable callback function.
   */
  isEmpty() {
    return this.listeners.size === 0;
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
