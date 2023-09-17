import { SyncHook } from "./SyncHook";
import type { PluginSystem } from "./PluginSystem";
import type { PerformaceEvent } from "./Interface";
import {
  currentTime,
  INVALID_VALUE,
  isNativeValue,
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

  // If value is equivalent, it represents an event bus
  // Note (need to guide users):
  //  The `value` is recorded here,
  //  but the value is unknown and there may be a memory leak.
  //  The user needs to manually close the performance monitoring to clear it.
  let records1 = new Map<any, Record<string, number>>();
  let records2: Record<any, Record<string, number>> = Object.create(null);

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
            const prevObj = isNativeValue(value)
              ? records2[value as any]
              : records1.get(value as any);

            if (prevObj) {
              const prevTime = prevObj[`${id}_${sk}`];
              if (typeof prevTime === "number") {
                hook.emit({
                  endArgs: args,
                  endContext: this,
                  events: [sk, ek],
                  equeValue: value,
                  time: currentTime() - prevTime,
                });
              }
            }
          }
        }

        if (key === sk) {
          value = value || getTargetInArgs(condition, args);
          if (value !== INVALID_VALUE) {
            let obj;
            const k = `${id}_${sk}`;
            const t = currentTime();

            if (isNativeValue(value)) {
              obj = records2[value as any];
              if (!obj) {
                obj = Object.create(null);
                records2[value as any] = obj;
              }
            } else {
              obj = records1.get(value);
              if (!obj) {
                obj = Object.create(null);
                records1.set(value, obj);
              }
            }
            obj[k] = t;
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
      records1.clear();
      records2 = Object.create(null);
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
