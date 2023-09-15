import { assert, INTERNAL } from "./Utils";
import type { ArgsType, Callback, HookType } from "./Interface";

export class SyncHook<T extends Array<unknown>, C = null, K = void> {
  public context: C;
  public type: HookType;
  public listeners = new Set<Callback<T, C, K>>();
  public before?: SyncHook<[HookType, C, ArgsType<T>]>;
  public after?: SyncHook<[HookType, C, ArgsType<T>]>;

  // Only `context` is allowed to be passed in from outside
  constructor(context?: C, _type: HookType = "SyncHook", _internal?: Symbol) {
    this.type = _type;
    this.context = typeof context === "undefined" ? (null as any) : context;
    if (_internal !== INTERNAL) {
      this.before = new SyncHook(null, "SyncHook", INTERNAL);
      this.after = new SyncHook(null, "SyncHook", INTERNAL);
    }
  }

  on(fn: Callback<T, C, K>) {
    assert(typeof fn === "function", `Invalid parameter in "${this.type}".`);
    this.listeners.add(fn);
  }

  once(fn: Callback<T, C, K>) {
    const self = this;
    this.on(function wrapper(...args: Array<unknown>) {
      self.remove(wrapper);
      return fn.apply(this, args as any);
    });
  }

  emit(...data: ArgsType<T>) {
    if (this.listeners.size > 0) {
      this.before?.emit(this.type, this.context, data);
      this.listeners.forEach((fn) => fn.apply(this.context, data));
      this.after?.emit(this.type, this.context, data);
    }
  }

  remove(fn: Callback<T, C, K>) {
    return this.listeners.delete(fn);
  }

  removeAll() {
    this.listeners.clear();
  }

  clone(): this {
    return new (this.constructor as any)(
      this.context,
      this.type,
      this.before ? null : INTERNAL
    );
  }
}
