import type { createTaskId } from './Utils';
import type { PluginSystem } from './PluginSystem';

// Plugins can extend this type themselves
export interface PluginApis extends Record<string, Record<string, unknown>> {}

export interface Plugin<
  T extends Record<string, any>,
  U = Record<string, unknown>,
> {
  name: string;
  hooks: {
    [K in keyof T]?: Parameters<T[K]['on']>[1];
  };
  apis?: U;
  version?: string;
  onceHooks?: {
    [K in keyof T]?: Parameters<T[K]['on']>[1];
  };
}
export type RefinePlugin<T extends Record<string, any>> = Partial<
  Pick<Plugin<T>, 'name' | 'version'>
> &
  Plugin<T>['hooks'];

export interface ExecErrorEvent {
  tag?: string;
  error: unknown;
  type: HookType;
  hook: (...args: Array<any>) => any;
}

export interface EachEvent<T, C> {
  id: TaskId;
  args: T;
  context: C;
  name: string;
  type: HookType;
  pluginExecTime: Record<string, number>;
}

export interface PerformanceEvent {
  time: number;
  equalValue: unknown;
  endContext: unknown;
  endArgs: Array<unknown>;
  events: [string, string];
}

export type ListenErrorEvent = ExecErrorEvent & {
  tag: string;
  name: string;
};

export type HookOn<
  T extends PluginSystem<Record<string, any>>,
  K extends keyof T['lifecycle'],
> = Parameters<T['lifecycle'][K]['on']>[1];

export type HooksOn<
  T extends PluginSystem<Record<string, any>>,
  K extends Array<keyof T['lifecycle']>,
> = {
  [P in K[number]]: HookOn<T, P>;
};

export type TaskId = ReturnType<typeof createTaskId>;
export type EachCallback<T, C> = (e: EachEvent<T, C>) => void;
export type ArgsType<T> = T extends Array<any> ? T : Array<unknown>;
export type CallbackReturnType<T> = T | false | Promise<T | false>;
export type Callback<T, C, K> = (this: C, ...args: ArgsType<T>) => K;
export type HookType =
  | 'SyncHook'
  | 'SyncWaterfallHook'
  | 'AsyncHook'
  | 'AsyncParallelHook'
  | 'AsyncWaterfallHook';
