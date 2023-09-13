import { assert } from "./Utils";
import type { ArgsType, Callback } from "./Interface";

export class SyncHook<T, K> {
  public type: string = "";
  public listeners = new Set<Callback<T, K>>();

  constructor(type = "SyncHook") {
    this.type = type;
  }

  on(fn: Callback<T, K>) {
    assert(typeof fn === "function", `Invalid parameter in "${this.type}".`);
    this.listeners.add(fn);
  }

  once(fn: Callback<T, K>) {
    const self = this;
    this.on(function wrapper(...args: Array<unknown>) {
      self.remove(wrapper);
      return fn.apply(null, args);
    });
  }

  emit(...data: ArgsType<T>) {
    if (this.listeners.size > 0) {
      this.listeners.forEach((fn) => fn.apply(null, data));
    }
  }

  remove(fn: Callback<T, K>) {
    return this.listeners.delete(fn);
  }

  removeAll() {
    this.listeners.clear();
  }
}
