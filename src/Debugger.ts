import type { PluginSystem } from "./PluginSystem";
import type { TaskId, EachEvent } from "./Interface";
import { isBrowser, currentTime } from "./Utils";

interface Data {
  tag?: string;
  time: number;
  e: EachEvent<unknown, unknown>;
}

export interface DebuggerOptions {
  tag?: string;
  group?: boolean;
  filter?: string | ((e: Data) => boolean);
  receiver?: (data: Data) => void;
}

export function createDebugger<T extends Record<string, unknown>>(
  plSys: PluginSystem<T>,
  options: DebuggerOptions
) {
  let { tag, group, filter, receiver } = options;
  let map: Record<TaskId, { t: number }> = Object.create(null);

  const _tag = tag ? `[${tag}]: ` : "";
  if (!("group" in options)) group = isBrowser;

  const unsubscribeBefore = plSys.beforeEach((e) => {
    map[e.id] = { t: currentTime() };
    if (typeof receiver !== "function") {
      console.time(`${_tag}${e.name}_${e.id}(t, args, ctx)`);
      if (group) console.groupCollapsed(e.name);
    }
  });

  const unsubscribeAfter = plSys.afterEach((e) => {
    let t: number | null = null;

    if (typeof filter === "string") {
      if (e.name.startsWith(filter)) return;
    } else if (typeof filter === "function") {
      t = currentTime() - map[e.id].t;
      if (filter({ e, tag, time: t })) return;
    }

    if (typeof receiver === "function") {
      if (t === null) {
        t = currentTime() - map[e.id].t;
      }
      receiver({ e, tag, time: t });
    } else {
      console.timeLog(
        `${_tag}${e.name}_${e.id}(t, args, ctx)`,
        e.args,
        e.context
      );
      if (group) console.groupEnd();
    }
  });

  return () => {
    unsubscribeBefore();
    unsubscribeAfter();
    map = Object.create(null);
  };
}
