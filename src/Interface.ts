export type Callback<T, K> = (...args: ArgsType<T>) => K;
export type ArgsType<T> = T extends Array<any> ? T : Array<any>;
export type CallbackReturnType<T> = T | false | Promise<T | false>;

export type Plugin<T extends Record<string, any>> = {
  [k in keyof T]?: Parameters<T[k]["on"]>[0];
} & {
  name: string;
  version?: string;
};
