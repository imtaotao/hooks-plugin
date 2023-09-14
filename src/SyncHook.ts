import { assert } from "./Utils";
import type { ArgsType, Callback } from "./Interface";

export class SyncHook<T, C = null, K = void> {
  public context: C;
  public type: string;
  public listeners = new Set<Callback<T, C, K>>();

  constructor(context?: C, type = "SyncHook") {
    this.type = type;
    // prettier-ignore
    this.context = typeof context === "undefined"
      ? (null as any)
      : context;
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
      this.listeners.forEach((fn) => fn.apply(this.context, data));
    }
  }

  clone(): this {
    return new (this.constructor as any)(this.context, this.type);
  }

  remove(fn: Callback<T, C, K>) {
    return this.listeners.delete(fn);
  }

  removeAll() {
    this.listeners.clear();
  }
}
