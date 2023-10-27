import { assert, INTERNAL, currentTime, createTaskId } from "./Utils";
import type {
  TaskId,
  ArgsType,
  Callback,
  HookType,
  ExecErrorEvent,
} from "./Interface";

export class SyncHook<T extends Array<unknown>, C = null, K = void> {
  private _locked: boolean;
  public context: C;
  public type: HookType;
  public listeners = new Set<Callback<T, C, K>>();
  public tags = new WeakMap<Callback<T, C, K>, string>();
  public errors = new Set<(e: ExecErrorEvent) => void>();
  public before?: SyncHook<[TaskId, HookType, C, ArgsType<T>]>;
  public after?: SyncHook<
    [TaskId, HookType, C, ArgsType<T>, Record<string, number>]
  >;

  // Only `context` is allowed to be passed in from outside
  constructor(context?: C, _type: HookType = "SyncHook", _internal?: Symbol) {
    this.type = _type;
    this._locked = false;
    this.context = typeof context === "undefined" ? (null as any) : context;

    // `before` and `after` hooks should not call other `before` and `after` hooks recursively,
    // as it can lead to infinite loops.
    if (_internal !== INTERNAL) {
      this.before = new SyncHook(null, "SyncHook", INTERNAL);
      this.after = new SyncHook(null, "SyncHook", INTERNAL);
    }
  }

  /**
   * @internal
   */
  protected _emitError(
    error: unknown,
    hook: (...args: Array<any>) => any,
    tag?: string
  ) {
    if (this.errors.size > 0) {
      this.errors.forEach((fn) =>
        fn({
          tag,
          hook,
          error,
          type: this.type,
        })
      );
    }
  }

  /**
   * Determine whether there is an executable callback function.
   */
  isEmpty() {
    return this.listeners.size === 0;
  }

  /**
   * By locking the current hook, you will no longer be able to add or remove callback functions from it.
   */
  lock() {
    this._locked = true;
    if (this.before) this.before.lock();
    if (this.after) this.after.lock();
    return this;
  }

  /**
   * Unlock the current hook.
   */
  unlock() {
    this._locked = false;
    if (this.before) this.before.unlock();
    if (this.after) this.after.unlock();
    return this;
  }

  /**
   * Register a hook.
   */
  on(fn: Callback<T, C, K>): void;
  on(tag: string, fn: Callback<T, C, K>): void;
  on(tag: string | Callback<T, C, K>, fn?: Callback<T, C, K>) {
    assert(!this._locked, "The current hook is now locked.");
    if (typeof tag === "function") {
      fn = tag;
      tag = "";
    }
    assert(typeof fn === "function", `Invalid parameter in "${this.type}".`);
    if (tag && typeof tag === "string") {
      this.tags.set(fn as Callback<T, C, K>, tag);
    }
    this.listeners.add(fn as Callback<T, C, K>);
    return this;
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
    return this;
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
        const record = () => {
          if (map && tag) {
            map[tag] = currentTime() - map[tag];
          }
        };
        try {
          fn.apply(this.context, data);
          record();
        } catch (e) {
          record();
          this._emitError(e, fn, tag);
        }
      });
      // The data being mapped will only be meaningful if `after` is not empty.
      this.after?.emit(id, this.type, this.context, data, map!);
    }
  }

  /**
   * Remove all hooks.
   */
  remove(fn: Callback<T, C, K>) {
    assert(!this._locked, "The current hook is now locked.");
    this.listeners.delete(fn);
    return this;
  }

  /**
   * Remove a specific hook.
   */
  removeAll() {
    assert(!this._locked, "The current hook is now locked.");
    this.listeners.clear();
    return this;
  }

  /**
   * Listen for errors when the hook is running.
   */
  listenError(fn: (e: ExecErrorEvent) => void) {
    assert(!this._locked, "The current hook is now locked.");
    this.errors.add(fn);
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
