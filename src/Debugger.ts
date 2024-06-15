import { now } from 'aidly';
import { isBrowser } from './Utils';
import type { PluginSystem } from './PluginSystem';
import type {
  TaskId,
  EachEvent,
  ListenErrorEvent,
  PerformanceEvent,
} from './Interface';

interface Data {
  tag?: string;
  time: number;
  e: EachEvent<unknown, unknown>;
}

interface PerformanceData {
  tag?: string;
  e: PerformanceEvent;
}

export interface DebuggerOptions {
  tag?: string;
  group?: boolean;
  listenError?: boolean;
  logPluginTime?: boolean;
  filter?: string | ((e: Data) => boolean);
  performance?: ReturnType<PluginSystem<any>['performance']>;
  receiver?: (data: Data) => void;
  errorReceiver?: (data: ListenErrorEvent) => void;
  performanceReceiver?: (data: PerformanceData) => void;
}

// If there is user defined performance data,
// it should also be printed here.
function logPerformance(
  p: ReturnType<PluginSystem<any>['performance']>,
  performanceReceiver?: (data: PerformanceData) => void,
  tag?: string,
) {
  const _tag = `[${tag || 'debug'}_performance]`;
  const fn = (e: PerformanceEvent) => {
    if (typeof performanceReceiver === 'function') {
      performanceReceiver({ tag, e });
    } else {
      console.log(
        `${_tag}(${e.events[0]} -> ${e.events[1]}): ${e.time}`,
        e.endArgs,
        e.endContext,
      );
    }
  };
  p._taskHooks.watch.add((hook) => hook.on(fn));
  p._taskHooks.hs.forEach((hook) => hook.on(fn));
}

export function createDebugger<T extends Record<string, unknown>>(
  plSys: PluginSystem<T>,
  options: DebuggerOptions,
) {
  let {
    tag,
    group,
    filter,
    receiver,
    listenError,
    logPluginTime,
    errorReceiver,
    performance,
    performanceReceiver,
  } = options;
  let unsubscribeError: (() => void) | null = null;
  let map: Record<TaskId, { t: number }> = Object.create(null);
  const _tag = `[${tag || 'debug'}]: `;

  if (!('group' in options)) group = isBrowser;
  if (!('listenError' in options)) listenError = true;
  if (!('logPluginTime' in options)) logPluginTime = true;
  if (performance) logPerformance(performance, performanceReceiver, tag);

  const prefix = (e: EachEvent<unknown, unknown>) => {
    let p = `${_tag}${e.name}_${e.id}(t, args, ctx`;
    p += logPluginTime ? ', pt)' : ')';
    return p;
  };

  const unsubscribeBefore = plSys.beforeEach((e) => {
    map[e.id] = { t: now() };
    if (typeof receiver !== 'function') {
      console.time(prefix(e));
      if (group) console.groupCollapsed(e.name);
    }
  });

  const unsubscribeAfter = plSys.afterEach((e) => {
    let t: number | null = null;

    if (typeof filter === 'string') {
      if (e.name.startsWith(filter)) {
        if (group) console.groupEnd();
        return;
      }
    } else if (typeof filter === 'function') {
      t = now() - map[e.id].t;
      if (filter({ e, tag, time: t })) {
        if (group) console.groupEnd();
        return;
      }
    }

    if (typeof receiver === 'function') {
      if (t === null) {
        t = now() - map[e.id].t;
      }
      receiver({ e, tag, time: t });
    } else {
      console.timeLog(
        prefix(e),
        e.args,
        e.context,
        logPluginTime ? e.pluginExecTime : '',
      );
      if (group) console.groupEnd();
    }
  });

  if (listenError) {
    unsubscribeError = plSys.listenError((e) => {
      if (typeof errorReceiver === 'function') {
        errorReceiver(e);
      } else {
        console.error(
          `[${tag}]: The error originated from "${e.tag}.${e.name}(${e.type})".\n`,
          `The hook function is: ${String(e.hook)}\n\n`,
          e.error,
        );
      }
    });
  }

  return () => {
    unsubscribeBefore();
    unsubscribeAfter();
    if (unsubscribeError) {
      unsubscribeError();
    }
    map = Object.create(null);
    if (performance) {
      performance.close();
    }
  };
}
