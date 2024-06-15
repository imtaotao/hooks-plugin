import { isPlainObject } from 'aidly';

export const INTERNAL = Symbol('internal_hooks');
export const INVALID_VALUE = Symbol('invalid_condition_value');
export const PERFORMANCE_PLUGIN_PREFIX = '__performance_monitor__';

export const isBrowser = typeof window !== 'undefined';

let taskId = 1;
export const createTaskId = () => taskId++;

let monitorTaskId = 1;
export const createMonitorTaskId = () => monitorTaskId++;

let monitorPluginId = 1;
export const createMonitorPluginId = () => monitorPluginId++;

export const checkReturnData = (
  originData: Record<string, unknown>,
  returnData: Record<string, unknown>,
) => {
  if (!isPlainObject(returnData)) return false;
  if (originData !== returnData) {
    for (const key in originData) {
      if (!(key in returnData)) {
        return false;
      }
    }
  }
  return true;
};

export const getTargetInArgs = (key: string, args: Array<unknown>) => {
  let target: unknown = args;
  const parts = key.split('.');
  for (let i = 0, l = parts.length; i < l; i++) {
    if (!target) return INVALID_VALUE;
    let p: string | number = parts[i];
    if (p.startsWith('[') && p.endsWith(']')) {
      p = Number(p.slice(1, -1));
    }
    target = (target as any)[p];
  }
  return target;
};
