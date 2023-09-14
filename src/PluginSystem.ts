import type { Plugin } from "./Interface";
import { PREFIX, assert, isPlainObject } from "./Utils";

export class PluginSystem<T extends Record<string, unknown>> {
  hooks: T;
  v = __VERSION__;
  plugins: Record<string, Plugin<T>> = Object.create(null);

  constructor(hooks: T) {
    this.hooks = hooks;
  }

  usePlugin<K extends T>(plugin: Plugin<K>) {
    assert(isPlainObject(plugin), "Invalid plugin configuration.");
    assert(plugin.name, 'Plugin must provide a "name".');

    if (!this.plugins[plugin.name]) {
      this.plugins[plugin.name] = plugin;
      const register = (obj?: Plugin<K>["hooks"], once?: boolean) => {
        if (!obj) return;
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
      };
      register(plugin.hooks, false);
      register(plugin.onceHooks, true);
    } else {
      console.warn(
        `${PREFIX}: Repeat to register plugin hooks "${plugin.name}".`
      );
    }
  }

  removePlugin(pluginName: string) {
    assert(pluginName, 'Must provide a "name".');
    const plugin = this.plugins[pluginName];
    assert(plugin, `Plugin "${pluginName}" is not registered.`);

    for (const key in plugin.hooks) {
      (this.hooks[key] as any).remove(plugin.hooks[key]);
    }
  }

  inherit<T extends PluginSystem<any>>({ plugins, hooks }: T) {
    for (const key in hooks) {
      assert(
        !this.hooks[key],
        `"${key as string}" hook has conflict and cannot be inherited.`
      );
      (this.hooks as any)[key] = hooks[key].clone();
    }
    for (const n in plugins) {
      if (!this.plugins[n]) {
        console.warn(
          `${PREFIX}: "${n}" plugin has conflict and cannot be inherited.`
        );
      }
      this.usePlugin(plugins[n]);
    }
    return this as typeof this & T;
  }
}
