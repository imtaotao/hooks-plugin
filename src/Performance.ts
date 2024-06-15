import { now, assert, isNativeValue } from 'aidly';
import { SyncHook } from './SyncHook';
import type { PluginSystem } from './PluginSystem';
import type { PerformanceEvent } from './Interface';
import {
  INVALID_VALUE,
  getTargetInArgs,
  createMonitorTaskId,
  createMonitorPluginId,
  PERFORMANCE_PLUGIN_PREFIX,
} from './Utils';

export function createPerformance<T extends Record<string, unknown>>(
  plSys: PluginSystem<T>,
  defaultCondition: string,
) {
  let hooks = {};
  let closed = false;
  const pluginName = `${PERFORMANCE_PLUGIN_PREFIX}${createMonitorPluginId()}`;

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
    [
      string,
      string,
      Partial<Record<string, string>>,
      SyncHook<[PerformanceEvent]>,
    ]
  > = Object.create(null);

  const findCondition = (
    key: string,
    conditions?: Partial<Record<string, string>>,
  ) => {
    if (!conditions) return defaultCondition;
    return conditions[key] || defaultCondition;
  };

  for (const key in plSys.lifecycle) {
    (hooks as any)[key] = function (...args: Array<unknown>) {
      let value: unknown;

      for (const id in monitorTask) {
        const [sk, ek, conditions, hook] = monitorTask[id];
        const condition = findCondition(key, conditions);

        if (key === ek) {
          value = getTargetInArgs(condition, args);
          if (value !== INVALID_VALUE) {
            const prevObj = isNativeValue(value)
              ? records2[value as any]
              : records1.get(value as any);

            if (prevObj) {
              const prevTime = prevObj[`${id}_${sk}`];
              if (typeof prevTime === 'number') {
                hook.emit({
                  endArgs: args,
                  endContext: this,
                  events: [sk, ek],
                  equeValue: value,
                  time: now() - prevTime,
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
            const t = now();

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
    /**
     * Turn off performance monitoring.
     */
    close() {
      if (!closed) {
        closed = true;
        records1.clear();
        records2 = Object.create(null);
        monitorTask = Object.create(null);
        this._taskHooks.hs.forEach((hook) => hook.removeAll());
        this._taskHooks.hs.clear();
        plSys.remove(pluginName);
      }
    },

    /**
     * Add new observation task.
     */
    monitor(
      sk: keyof T,
      ek: keyof T,
      conditions?: Partial<Record<string, string>>,
    ) {
      assert(!closed, 'Unable to add tasks to a closed performance observer.');
      const id = createMonitorTaskId();
      const hook = new SyncHook<[PerformanceEvent]>();
      const task = [sk, ek, conditions, hook];
      monitorTask[id] = task as any;
      this._taskHooks.add(hook);
      return hook;
    },

    _taskHooks: {
      hs: new Set<SyncHook<[PerformanceEvent]>>(),
      watch: new Set<(hook: SyncHook<[PerformanceEvent]>) => void>(),

      add(hook: SyncHook<[PerformanceEvent]>) {
        this.hs.add(hook);
        this.watch.forEach((fn) => fn(hook));
      },
    },
  };
}
