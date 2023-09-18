import type { SyncHook } from "./SyncHook";
import { createPerformance } from "./Performance";
import { type DebuggerOptions, createDebugger } from "./Debugger";
import { assert, isPlainObject, PERFORMANCE_PLUGIN_PREFIX } from "./Utils";
import type {
  TaskId,
  HookType,
  Plugin,
  PluginApis,
  EachCallback,
} from "./Interface";

export class PluginSystem<T extends Record<string, unknown>> {
  private _locked: boolean;
  private _debugs: Set<() => void>;
  private _performances: Set<() => void>;
  public lifecycle: T;
  public v = __VERSION__;
  public plugins: Record<string, Plugin<T, PluginApis[string]>>;

  constructor(lifecycle?: T) {
    this._locked = false;
    this._debugs = new Set();
    this._performances = new Set();
    this.plugins = Object.create(null);
    this.lifecycle = lifecycle || Object.create(null);
  }

  private _onEmitLifeHook<T extends Array<unknown>, C>(
    type: "before" | "after",
    fn: EachCallback<T, C>
  ) {
    assert(
      !this._locked,
      `The plugin system is locked and cannot add "${type}" hook.`
    );
    let map = Object.create(null);

    for (const key in this.lifecycle) {
      map[key] = (
        id: TaskId,
        type: HookType,
        context: C,
        args: T,
        map: Record<string, number>
      ) => {
        // Disallow deleting `id` as it may cause confusion.
        fn(
          Object.freeze({
            id,
            type,
            args,
            context,
            name: key,
            pluginExecTime: map,
          })
        );
      };
      (this.lifecycle[key] as SyncHook<T, C>)[type]!.on(map[key]);
    }

    return () => {
      for (const key in this.lifecycle) {
        (this.lifecycle[key] as SyncHook<T, C>)[type]!.remove(map[key]);
      }
      map = Object.create(null);
    };
  }

  /**
   * Lock the plugin system. After locking, you will not be able to register and uninstall plugins.
   */
  lock() {
    this._locked = true;
    for (const key in this.lifecycle) {
      (this.lifecycle[key] as any).lock();
    }
  }

  /**
   * Unlock the plugin system. After unlocking, you can re-register and uninstall plugins.
   */
  unlock() {
    this._locked = false;
    for (const key in this.lifecycle) {
      (this.lifecycle[key] as any).unlock();
    }
  }

  /**
   * Registers a (sync) callback to be called before each hook is being called.
   */
  beforeEach<T extends Array<unknown>, C extends unknown>(
    fn: EachCallback<T, C>
  ) {
    return this._onEmitLifeHook<T, C>("before", fn);
  }

  /**
   * Registers a (sync) callback to be called after each hook is being called.
   */
  afterEach<T extends Array<unknown>, C extends unknown>(
    fn: EachCallback<T, C>
  ) {
    return this._onEmitLifeHook<T, C>("after", fn);
  }

  /**
   * Monitor elapsed time between hooks.
   */
  performance(defaultCondition: string): ReturnType<typeof createPerformance> {
    assert(
      defaultCondition && typeof defaultCondition === "string",
      "A judgment `conditions` is required to use `performance`."
    );
    const obj = createPerformance(this, defaultCondition);
    const { close } = obj;
    const f = () => {
      this._performances.delete(f);
      return close.call(obj);
    };
    obj.close = f;
    this._performances.add(f);
    return obj;
  }

  /**
   * Remove all performance monitoring.
   */
  removePerformances() {
    this._performances.forEach((fn) => fn());
  }

  /**
   * Remove all debug instances.
   */
  debug(options: DebuggerOptions = {}) {
    const close = createDebugger(this, options);
    const f = () => {
      this._debugs.delete(f);
      close();
    };
    this._debugs.add(f);
    return f;
  }

  removeDebugs() {
    this._debugs.forEach((fn) => fn());
  }

  /**
   * Get the `apis` of a plugin.
   */
  getPluginApis<N extends keyof PluginApis>(pluginName: N) {
    return this.plugins[pluginName as string]
      .apis as PluginApis[typeof pluginName];
  }

  /**
   * Register plugin.
   */
  use<P extends Plugin<T>>(plugin: P): P;
  use<F extends (plSys: this) => Plugin<T>>(plugin: F): ReturnType<F>;
  use(plugin: Plugin<T> | ((plSys: this) => Plugin<T>)) {
    assert(
      !this._locked,
      "The plugin system is locked and new plugins cannot be added."
    );
    if (typeof plugin === "function") plugin = plugin(this);
    assert(isPlainObject(plugin), "Invalid plugin configuration.");
    const { name } = plugin;
    assert(name && typeof name === "string", 'Plugin must provide a "name".');
    assert(!this.plugins[name], `Repeat to register plugin hooks "${name}".`);

    const register = (obj?: Record<string, unknown>, once?: boolean) => {
      if (obj) {
        for (const key in obj) {
          assert(
            this.lifecycle[key],
            `"${key}" hook is not defined in plugin "${name}".`
          );
          // The loss of built-in plugins for performance statistics is negligible
          const tag = name.startsWith(PERFORMANCE_PLUGIN_PREFIX) ? "" : name;
          if (once) {
            (this.lifecycle[key] as any).once(tag, obj[key]);
          } else {
            (this.lifecycle[key] as any).on(tag, obj[key]);
          }
        }
      }
    };

    register(plugin.hooks, false);
    register(plugin.onceHooks, true);
    this.plugins[name] = plugin;
    return plugin;
  }

  /**
   * Remove plugin.
   */
  remove(pluginName: string) {
    assert(
      !this._locked,
      "The plugin system has been locked and the plugin cannot be cleared."
    );
    assert(pluginName, 'Must provide a "name".');

    const plugin = this.plugins[pluginName];
    if (plugin) {
      const rm = (obj?: (typeof plugin)["hooks"]) => {
        if (obj) {
          for (const key in obj) {
            (this.lifecycle[key] as any).remove(obj[key]);
          }
        }
      };
      rm(plugin.hooks);
      rm(plugin.onceHooks);
    }
  }

  /**
   * Clone a brand new pluginSystem instance.
   */
  clone(usePlugin?: boolean) {
    const newLifecycle = {};
    for (const key in this.lifecycle) {
      (newLifecycle as any)[key] = (this.lifecycle[key] as any).clone();
    }
    const cloned: this = new (this.constructor as any)(newLifecycle);
    if (usePlugin) {
      for (const key in this.plugins) {
        cloned.use(this.plugins[key]);
      }
    }
    return cloned;
  }
}
