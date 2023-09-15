import type { createTaskId } from "./Utils";

// Plugins can extend this type themselves
export interface PluginApis extends Record<string, Record<string, unknown>> {}

export interface Plugin<
  T extends Record<string, any>,
  K = Record<string, unknown>
> {
  name: string;
  version?: string;
  apis?: K;
  hooks?: {
    [k in keyof T]?: Parameters<T[k]["on"]>[0];
  };
  onceHooks?: {
    [k in keyof T]?: Parameters<T[k]["on"]>[0];
  };
}

export interface EachEvent<T, C> {
  id: TaskId;
  args: T;
  context: C;
  name: string;
  type: HookType;
}

export type TaskId = ReturnType<typeof createTaskId>;
export type EachCallback<T, C> = (e: EachEvent<T, C>) => void;
export type ArgsType<T> = T extends Array<any> ? T : Array<unknown>;
export type CallbackReturnType<T> = T | false | Promise<T | false>;
export type Callback<T, C, K> = (this: C, ...args: ArgsType<T>) => K;
export type HookType =
  | "SyncHook"
  | "SyncWaterfallHook"
  | "AsyncHook"
  | "AsyncParallelHook"
  | "AsyncWaterfallHook";
