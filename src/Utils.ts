import type { BaseType } from "./Interface";

const objectToString = Object.prototype.toString;

const PREFIX = "[hooksPlugin]";
export const INTERNAL = Symbol("internal_hooks");
export const INVALID_VALUE = Symbol("invalid_condition_value");
export const PERFORMANCE_PLUGIN_PREFIX = "__performance_monitor__";

export const isBrowser = typeof window !== "undefined";

let taskId = 1;
export function createTaskId() {
  return taskId++;
}

let monitorTaskId = 1;
export function createMonitorTaskId() {
  return monitorTaskId++;
}

let monitorPluginId = 1;
export function createMonitorPluginId() {
  return monitorPluginId++;
}

export function currentTime() {
  return typeof performance?.now === "function"
    ? performance.now()
    : Date.now();
}

export function hasOwn(obj: Record<any, any>, key: string) {
  return Object.hasOwnProperty.call(obj, key);
}

export function isPlainObject(val: unknown): val is object {
  return objectToString.call(val) === "[object Object]";
}

export function isNativeValue(val: unknown): val is BaseType {
  return (
    typeof val === "number" ||
    typeof val === "bigint" ||
    typeof val === "string" ||
    typeof val === "symbol" ||
    typeof val === "boolean" ||
    val === undefined ||
    val === null
  );
}

export function assert(condition: unknown, error?: string): asserts condition {
  if (!condition) {
    throw new Error(`${PREFIX}: ${error}`);
  }
}

export function checkReturnData(
  originData: Record<string, unknown>,
  returnData: Record<string, unknown>
) {
  if (!isPlainObject(returnData)) return false;
  if (originData !== returnData) {
    for (const key in originData) {
      if (!(key in returnData)) {
        return false;
      }
    }
  }
  return true;
}

export function getTargetInArgs(key: string, args: Array<unknown>) {
  let target: unknown = args;
  const parts = key.split(".");
  for (let i = 0, l = parts.length; i < l; i++) {
    if (!target) return INVALID_VALUE;
    let p: string | number = parts[i];
    if (p.startsWith("[") && p.endsWith("]")) {
      p = Number(p.slice(1, -1));
    }
    target = (target as any)[p];
  }
  return target;
}
