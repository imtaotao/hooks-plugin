import type { Plugin } from "./Interface";
import { PREFIX, assert, isPlainObject } from "./Utils";

export class PluginSystem<T extends Record<string, any>> {
  lifecycle: T;
  lifecycleKeys: Array<keyof T>;
  registerPlugins: Record<string, Plugin<T>> = {};
  version = __VERSION__;

  constructor(lifecycle: T) {
    this.lifecycle = lifecycle;
    this.lifecycleKeys = Object.keys(lifecycle);
  }

  usePlugin(plugin: Plugin<T>) {
    assert(isPlainObject(plugin), "Invalid plugin configuration.");
    // Plugin name is required and unique
    const pluginName = plugin.name;
    assert(pluginName, 'Plugin must provide a "name".');

    if (!this.registerPlugins[pluginName]) {
      this.registerPlugins[pluginName] = plugin;

      for (const key of Object.keys(plugin)) {
        if (key === "name") continue;
        const pluginLife = plugin[key as string];
        assert(
          this.lifecycle[key],
          `"${key}" hook is not defined in plugin "${pluginName}".`
        );
        // Differentiate different types of hooks and adopt different registration strategies
        this.lifecycle[key].on(pluginLife);
      }
    } else {
      console.warn(
        `${PREFIX}: Repeat to register plugin hooks "${pluginName}".`
      );
    }
  }

  removePlugin(pluginName: string) {
    assert(pluginName, 'Must provide a "name".');
    const plugin = this.registerPlugins[pluginName];
    assert(plugin, `Plugin "${pluginName}" is not registered.`);

    for (const key in plugin) {
      if (key === "name") continue;
      this.lifecycle[key].remove(plugin[key as string]);
    }
  }

  inherit<T extends PluginSystem<any>>({ lifecycle, registerPlugins }: T) {
    for (const hookName in lifecycle) {
      assert(
        !this.lifecycle[hookName],
        `"${hookName as string}" hook has conflict and cannot be inherited.`
      );
      (this.lifecycle as any)[hookName] = lifecycle[hookName];
    }
    for (const pluginName in registerPlugins) {
      assert(
        !this.registerPlugins[pluginName],
        `"${pluginName}" plugin has conflict and cannot be inherited.`
      );
      this.usePlugin(registerPlugins[pluginName]);
    }
    return this as typeof this & T;
  }
}
