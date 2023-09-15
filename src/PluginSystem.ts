import { PREFIX, assert, isPlainObject } from "./Utils";
import type { Plugin, PluginApis } from "./Interface";

export class PluginSystem<T extends Record<string, unknown>> {
  public hooks: T;
  public v = __VERSION__;
  public plugins: Record<string, Plugin<T, PluginApis[string]>> =
    Object.create(null);
  private locked: boolean = false;

  constructor(hooks: T) {
    this.hooks = hooks;
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  getPluginApis<N extends keyof PluginApis>(pluginName: N) {
    return this.plugins[pluginName as string]
      .apis as PluginApis[typeof pluginName];
  }

  // When plugins inherit from each other, pass generics
  use<P extends Plugin<T, Record<string, unknown>>>(plugin: P) {
    assert(
      !this.locked,
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
              this.hooks[key],
              `"${key}" hook is not defined in plugin "${plugin.name}".`
            );
            if (once) {
              (this.hooks[key] as any).once(obj[key]);
            } else {
              (this.hooks[key] as any).on(obj[key]);
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
      !this.locked,
      "The plugin system has been locked and the plugin cannot be cleared."
    );
    assert(pluginName, 'Must provide a "name".');
    const plugin = this.plugins[pluginName];

    if (plugin) {
      const rm = (obj?: (typeof plugin)["hooks"]) => {
        if (obj) {
          for (const key in obj) {
            (this.hooks[key] as any).remove(obj[key]);
          }
        }
      };
      rm(plugin.hooks);
      rm(plugin.onceHooks);
    }
  }
}
