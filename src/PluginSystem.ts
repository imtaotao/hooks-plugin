import { PREFIX, assert, isPlainObject } from "./Utils";
import type { SyncHook } from "./SyncHook";
import type { Plugin, PluginApis, EachCallback, HookType } from "./Interface";

export class PluginSystem<T extends Record<string, unknown>> {
  private _locked: boolean;
  public lifecycle: T;
  public v = __VERSION__;
  public plugins: Record<string, Plugin<T, PluginApis[string]>>;

  constructor(lifecycle: T) {
    this._locked = false;
    this.plugins = Object.create(null);
    this.lifecycle = lifecycle;
  }

  private _addEmitLifeHook<T extends Array<unknown>, C>(
    type: "before" | "after",
    fn: EachCallback<T, C>
  ) {
    let map = Object.create(null);
    for (const name in this.lifecycle) {
      map[name] = (type: HookType, context: C, args: T) => {
        fn({ name, type, args, context });
      };
      (this.lifecycle[name] as SyncHook<T, C>)[type]!.on(map[name]);
    }
    return () => {
      for (const name in this.lifecycle) {
        (this.lifecycle[name] as SyncHook<T, C>)[type]!.remove(map[name]);
      }
      map = Object.create(null);
    };
  }

  lock() {
    this._locked = true;
  }

  unlock() {
    this._locked = false;
  }

  beforeEach<T extends Array<unknown>, C extends unknown>(
    fn: EachCallback<T, C>
  ) {
    return this._addEmitLifeHook<T, C>("before", fn);
  }

  afterEach<T extends Array<unknown>, C extends unknown>(
    fn: EachCallback<T, C>
  ) {
    return this._addEmitLifeHook<T, C>("after", fn);
  }

  getPluginApis<N extends keyof PluginApis>(pluginName: N) {
    return this.plugins[pluginName as string]
      .apis as PluginApis[typeof pluginName];
  }

  use<P extends Plugin<T, Record<string, unknown>>>(plugin: P) {
    assert(
      !this._locked,
      "The plugin system is locked and new plugins cannot be added."
    );
    assert(isPlainObject(plugin), "Invalid plugin configuration.");
    assert(plugin.name, 'Plugin must provide a "name".');

    if (this.plugins[plugin.name]) {
      console.warn(
        `${PREFIX}: Repeat to register plugin hooks "${plugin.name}".`
      );
    } else {
      this.plugins[plugin.name] = plugin;
      const register = (obj?: P["hooks"], once?: boolean) => {
        if (obj) {
          for (const key in obj) {
            assert(
              this.lifecycle[key],
              `"${key}" hook is not defined in plugin "${plugin.name}".`
            );
            if (once) {
              (this.lifecycle[key] as any).once(obj[key]);
            } else {
              (this.lifecycle[key] as any).on(obj[key]);
            }
          }
        }
      };
      register(plugin.hooks, false);
      register(plugin.onceHooks, true);
    }
    return this.plugins[plugin.name] as P;
  }

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
}
