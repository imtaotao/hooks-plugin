export type ArgsType<T> = T extends Array<any> ? T : Array<unknown>;
export type CallbackReturnType<T> = T | false | Promise<T | false>;
export type Callback<T, C, K> = (this: C, ...args: ArgsType<T>) => K;

// Plugins can extend this type themselves
export interface PluginApis extends Record<string, unknown> {}

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
