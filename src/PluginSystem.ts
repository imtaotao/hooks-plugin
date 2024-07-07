import { assert, pick, hasOwn, isPlainObject } from 'aidly';
import { PERFORMANCE_PLUGIN_PREFIX } from './Utils';
import { SyncHook } from './SyncHook';
import { AsyncHook } from './AsyncHook';
import { AsyncParallelHook } from './AsyncParallelHook';
import { SyncWaterfallHook } from './SyncWaterfallHook';
import { AsyncWaterfallHook } from './AsyncWaterfallHook';
import { createPerformance } from './Performance';
import { type DebuggerOptions, createDebugger } from './Debugger';
import type {
  TaskId,
  HookType,
  Plugin,
  PluginApis,
  EachCallback,
  ExecErrorEvent,
  ListenErrorEvent,
} from './Interface';

const HOOKS = {
  SyncHook,
  AsyncHook,
  AsyncParallelHook,
  SyncWaterfallHook,
  AsyncWaterfallHook,
};

export class PluginSystem<T extends Record<string, unknown>> {
  private _locked: boolean;
  private _debugs: Set<() => void>;
  private _performances: Set<() => void>;
  private _lockListenSet: Set<(locked: boolean) => void>;

  public lifecycle: T;
  public plugins: Record<string, Plugin<T, PluginApis[string]>>;

  constructor(lifecycle?: T) {
    this._locked = false;
    this._debugs = new Set();
    this._performances = new Set();
    this._lockListenSet = new Set();
    this.plugins = Object.create(null);
    this.lifecycle = lifecycle || Object.create(null);
  }

  /**
   * @internal
   */
  private _onEmitLifeHook<T extends Array<unknown>, C>(
    type: 'before' | 'after',
    fn: EachCallback<T, C>,
  ) {
    assert(
      !this._locked,
      `The plugin system is locked and cannot add "${type}" hook.`,
    );
    let map = Object.create(null);

    for (const key in this.lifecycle) {
      map[key] = (
        id: TaskId,
        type: HookType,
        context: C,
        args: T,
        map: Record<string, number>,
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
          }),
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
   * Observing the changes in `lock`.
   */
  listenLock(fn: (locked: boolean) => void) {
    this._lockListenSet.add(fn);
  }

  /**
   * Lock the plugin system. After locking, you will not be able to register and uninstall plugins.
   */
  lock() {
    this._locked = true;
    for (const key in this.lifecycle) {
      (this.lifecycle[key] as any).lock();
    }
    if (this._lockListenSet.size > 0) {
      this._lockListenSet.forEach((fn) => fn(true));
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
    if (this._lockListenSet.size > 0) {
      this._lockListenSet.forEach((fn) => fn(false));
    }
  }

  /**
   * Registers a (sync) callback to be called before each hook is being called.
   */
  beforeEach<T extends Array<unknown>, C extends unknown>(
    fn: EachCallback<T, C>,
  ) {
    return this._onEmitLifeHook<T, C>('before', fn);
  }

  /**
   * Registers a (sync) callback to be called after each hook is being called.
   */
  afterEach<T extends Array<unknown>, C extends unknown>(
    fn: EachCallback<T, C>,
  ) {
    return this._onEmitLifeHook<T, C>('after', fn);
  }

  /**
   * Monitor elapsed time between hooks.
   */
  performance(defaultCondition: string): ReturnType<typeof createPerformance> {
    assert(
      !this._locked,
      'The plugin system is locked and performance cannot be monitored.',
    );
    assert(
      defaultCondition && typeof defaultCondition === 'string',
      'A judgment `conditions` is required to use `performance`.',
    );
    const obj = createPerformance(this, defaultCondition);
    const { close } = obj;
    const fn = () => {
      assert(
        !this._locked,
        'The plugin system is locked and removal operations are not allowed.',
      );
      this._performances.delete(fn);
      return close.call(obj);
    };
    obj.close = fn;
    this._performances.add(fn);
    return obj;
  }

  /**
   * Remove all performance monitoring.
   */
  removeAllPerformance() {
    assert(
      !this._locked,
      'The plugin system is locked and removal operations are not allowed.',
    );
    this._performances.forEach((fn) => fn());
  }

  /**
   * Add debugger.
   */
  debug(options: DebuggerOptions = {}) {
    assert(
      !this._locked,
      'The plugin system is locked and the debugger cannot be added.',
    );
    const close = createDebugger(this, options);
    const fn = () => {
      assert(
        !this._locked,
        'The plugin system is locked and removal operations are not allowed.',
      );
      this._debugs.delete(fn);
      close();
    };
    this._debugs.add(fn);
    return fn;
  }

  /**
   * Remove all debug instances.
   */
  removeAllDebug() {
    assert(
      !this._locked,
      'The plugin system is locked and removal operations are not allowed.',
    );
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
   * Listen for errors when the hook is running.
   */
  listenError(fn: (data: ListenErrorEvent) => void) {
    assert(
      !this._locked,
      'The plugin system is locked and cannot listen for errors.',
    );
    const map = Object.create(null);
    for (const key in this.lifecycle) {
      map[key] = (e: ExecErrorEvent) => {
        fn(Object.assign(e as any, { name: key }));
      };
      (this.lifecycle[key] as any).listenError(map[key]);
    }
    return () => {
      assert(
        !this._locked,
        'The plugin system is locked and the listening error cannot be removed.',
      );
      for (const key in this.lifecycle) {
        (this.lifecycle[key] as any).errors.delete(map[key]);
      }
    };
  }

  /**
   * Register plugin.
   */
  use<P extends Plugin<T>>(plugin: P): P;
  use<F extends (plSys: this) => Plugin<T>>(plugin: F): ReturnType<F>;
  use(plugin: Plugin<T> | ((plSys: this) => Plugin<T>)) {
    assert(
      !this._locked,
      `The plugin system is locked and new plugins cannot be added${
        plugin.name ? `(${plugin.name})` : ''
      }.`,
    );
    if (typeof plugin === 'function') plugin = plugin(this);
    assert(isPlainObject(plugin), 'Invalid plugin configuration.');
    const { name } = plugin;
    assert(name && typeof name === 'string', 'Plugin must provide a "name".');
    assert(!this.isUsed(name), `Repeat to register plugin hooks "${name}".`);

    const register = (obj?: Record<string, unknown>, once?: boolean) => {
      if (obj) {
        for (const key in obj) {
          assert(
            hasOwn(this.lifecycle, key),
            `"${key}" hook is not defined in plugin "${name}".`,
          );
          // The loss of built-in plugins for performance statistics is negligible
          const tag = name.startsWith(PERFORMANCE_PLUGIN_PREFIX) ? '' : name;
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
      'The plugin system has been locked and the plugin cannot be cleared.',
    );
    assert(pluginName, 'Must provide a "name".');

    if (hasOwn(this.plugins, pluginName)) {
      const plugin = this.plugins[pluginName];
      const rm = (obj?: (typeof plugin)['hooks']) => {
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
   * Select some of the lifycycle hooks.
   */
  pickLifyCycle<T extends keyof this['lifecycle']>(keys: Array<T>) {
    return pick(this.lifecycle, keys);
  }

  /**
   * Determine whether a plugin is registered.
   */
  isUsed(pluginName: string) {
    assert(pluginName, 'Must provide a "name".');
    return hasOwn(this.plugins, pluginName);
  }

  /**
   * Create a new plugin system.
   */
  create<T extends (hooks: typeof HOOKS) => Record<string, unknown>>(
    callback: T,
  ) {
    return new PluginSystem<ReturnType<T>>(callback(HOOKS) as any);
  }

  /**
   * Clone a brand new pluginSystem instance.
   */
  clone(usePlugin?: boolean) {
    const newLifecycle = Object.create(null);
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
