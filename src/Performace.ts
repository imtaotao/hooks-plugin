import { SyncHook } from "./SyncHook";
import type { PluginSystem } from "./PluginSystem";
import type { PerformaceEvent } from "./Interface";
import {
  currentTime,
  INVALID_VALUE,
  getTargetInArgs,
  createMonitorTaskId,
  createMonitorPluginId,
  PERFORMACE_PLUGIN_PREFIX,
} from "./Utils";

export function createPerformace<T extends Record<string, unknown>>(
  plSys: PluginSystem<T>,
  condition: string
) {
  let hooks = {};
  const pluginName = `${PERFORMACE_PLUGIN_PREFIX}${createMonitorPluginId()}`;

  // The `value` is recorded here,
  // but the value is unknown and there may be a memory leak.
  // The user needs to manually close the performance monitoring to clear it.
  let records: Record<string, { value: unknown; t: number }> =
    Object.create(null);

  // Some information about each time a monitor is created is recorded here.
  let monitorTask: Record<
    number,
    [string, string, SyncHook<[PerformaceEvent]>]
  > = Object.create(null);

  for (const key in plSys.lifecycle) {
    (hooks as any)[key] = function (...args: Array<unknown>) {
      let value: unknown;

      for (const id in monitorTask) {
        const [sk, ek, hook] = monitorTask[id];

        if (key === ek) {
          value = getTargetInArgs(condition, args);
          if (value !== INVALID_VALUE) {
            const prev = records[`${id}_${sk}`];
            if (prev && value === prev.value) {
              hook.emit({
                endArgs: args,
                endContext: this,
                events: [sk, ek],
                time: currentTime() - prev.t,
              });
            }
          }
        }

        if (key === sk) {
          value = value || getTargetInArgs(condition, args);
          if (value !== INVALID_VALUE) {
            records[`${id}_${sk}`] = {
              value,
              t: currentTime(),
            };
          }
        }
      }
    };
  }

  plSys.use({
    hooks,
    name: pluginName,
    version: __VERSION__,
  });

  return {
    close() {
      plSys.remove(pluginName);
      records = Object.create(null);
      monitorTask = Object.create(null);
      this.taskHooks.hs.clear();
      this.taskHooks.hs.forEach((hook) => {
        hook.removeAll();
      });
    },

    monitor(sk: keyof T, ek: keyof T) {
      const id = createMonitorTaskId();
      const hook = new SyncHook<[PerformaceEvent]>();
      const task = [sk, ek, hook];
      monitorTask[id] = task as any;
      this.taskHooks.add(hook);
      return hook;
    },

    taskHooks: {
      hs: new Set<SyncHook<[PerformaceEvent]>>(),
      watch: new Set<(hook: SyncHook<[PerformaceEvent]>) => void>(),

      add(hook: SyncHook<[PerformaceEvent]>) {
        this.hs.add(hook);
        this.watch.forEach((fn) => fn(hook));
      },
    },
  };
}
