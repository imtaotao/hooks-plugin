export type ArgsType<T> = T extends Array<any> ? T : Array<any>;
export type CallbackReturnType<T> = T | false | Promise<T | false>;
export type Callback<T, C, K> = (this: C, ...args: ArgsType<T>) => K;

export interface Plugin<T extends Record<string, any>> {
  name: string;
  version?: string;
  hooks: {
    [k in keyof T]?: Parameters<T[k]["on"]>[0];
  };
}
