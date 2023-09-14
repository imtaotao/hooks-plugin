import {
  type Plugin,
  SyncHook,
  AsyncHook,
  SyncWaterfallHook,
  AsyncParallelHook,
  AsyncWaterfallHook,
  PluginSystem,
} from "../../index";

describe("PluginSystem", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("Check version", () => {
    const plugin = new PluginSystem({});
    expect(typeof plugin.v === "string").toBe(true);
  });

  it("Check plugin version", () => {
    const plugin = new PluginSystem({});
    plugin.usePlugin({
      name: "test",
      hooks: {},
    });

    plugin.usePlugin({
      name: "test2",
      version: "1.0",
      hooks: {},
    });

    expect(plugin.plugins["test"].version === undefined).toBe(true);
    expect(plugin.plugins["test2"].version === "1.0").toBe(true);
  });

  it("Check parameter", () => {
    const plugin = new PluginSystem({
      a: new SyncHook(),
      b: new SyncHook(),
    });

    expect(() => {
      plugin.usePlugin([] as any);
    }).toThrowError();
    expect(() => {
      plugin.usePlugin({} as any);
    }).toThrowError();
    expect(() => {
      plugin.removePlugin("");
    }).toThrowError();
    expect(() => {
      plugin.removePlugin("a");
    }).toThrowError();
    expect(Object.keys(plugin.hooks)).toEqual(["a", "b"]);
  });

  it("Check for hooks declared not to exist", () => {
    const plugin = new PluginSystem({
      a: new SyncHook(),
    });

    expect(() => {
      plugin.usePlugin({
        name: "test",
        hooks: {
          b() {},
        },
      } as any);
    }).toThrowError();
  });

  it("Check once hooks", () => {
    const plugin = new PluginSystem({
      a: new SyncWaterfallHook<{ value: number }>(),
    });

    plugin.usePlugin({
      name: "t1",
      hooks: {
        a(data) {
          data.value = 1;
          return data;
        },
      },
      onceHooks: {
        a(data) {
          data.value = 2;
          return data;
        },
      },
    });

    // registered after once hook, so here is `2`
    expect(plugin.hooks.a.emit({ value: 0 })).toEqual({ value: 2 });
    expect(plugin.hooks.a.emit({ value: 0 })).toEqual({ value: 1 });
    expect(plugin.hooks.a.emit({ value: 0 })).toEqual({ value: 1 });
  });

  it("Add plugin and remove plugin", () => {
    const plugin = new PluginSystem({
      a: new SyncHook(),
      b: new SyncHook(),
    });

    let i = 0;
    let j = 0;
    plugin.usePlugin({
      name: "test1",
      hooks: {
        a() {
          i++;
        },
        b() {
          j++;
        },
      },
    });

    plugin.usePlugin({
      name: "test2",
      hooks: {
        a() {
          i++;
        },
        b() {
          j++;
        },
      },
    });

    plugin.hooks.a.emit();
    expect(i).toBe(2);
    plugin.hooks.b.emit();
    expect(j).toBe(2);

    i = 0;
    j = 0;
    plugin.removePlugin("test1");

    plugin.hooks.a.emit();
    expect(i).toBe(1);
    plugin.hooks.b.emit();
    expect(j).toBe(1);
  });

  it("Data check", () => {
    const plugin = new PluginSystem({
      a: new SyncHook<[string], void>(),
    });

    const obj: Plugin<typeof plugin.hooks> = {
      name: "test",
      hooks: {
        a(s) {
          expect(s).toBe("chen");
        },
      },
    };
    const spy = jest.spyOn(obj.hooks!, "a");
    plugin.usePlugin(obj);
    plugin.hooks.a.emit("chen");

    expect(spy).toHaveBeenCalled();
    spy.mockReset();
    spy.mockRestore();
  });

  it("Plugin inherit check(1)", () => {
    const plugin1 = new PluginSystem({
      a: new SyncHook<[string], void>(),
    });
    const plugin2 = new PluginSystem({
      a: new SyncHook<[string], void>(),
    });
    expect(() => plugin2.inherit(plugin1)).toThrowError();
  });

  it("Plugin inherit check(2)", () => {
    const plugin1 = new PluginSystem({
      a: new SyncHook<[string], void>(),
    });

    plugin1.usePlugin({
      name: "test",
      hooks: {
        a() {},
      },
    });

    const plugin2 = new PluginSystem({
      b: new SyncHook<[string], void>(),
    });

    plugin2.usePlugin({
      name: "test",
      hooks: {
        b() {},
      },
    });

    const plugin3 = plugin2.inherit(plugin1);
    expect(Object.keys(plugin3.plugins)).toEqual(["test"]);
  });

  it("Plugin inherit", () => {
    let i = 0;
    const plugin1 = new PluginSystem({
      a: new SyncHook<[string], void>(),
    });

    plugin1.usePlugin({
      name: "test1",
      hooks: {
        a(data) {
          i++;
          expect(data).toBe("chen");
        },
      },
      onceHooks: {
        a(data) {
          i++;
          expect(data).toBe("chen");
        },
      },
    });

    const plugin2 = new PluginSystem({
      b: new SyncHook<[string], void>(),
    });

    plugin1.hooks.a.emit("chen");
    expect(i).toBe(2);

    const plugin3 = plugin2.inherit(plugin1);

    plugin3.usePlugin<typeof plugin3.hooks>({
      name: "test3",
      hooks: {
        a(data) {
          i++;
          expect(data).toBe("chen");
        },
      },
    });

    i = 0;
    plugin3.hooks.a.emit("chen");
    expect(i).toBe(3);
    i = 0;
    plugin3.hooks.a.emit("chen");
    expect(i).toBe(2);
  });

  it("Remove plugin", () => {
    const plugin = new PluginSystem({
      a: new SyncHook(),
    });

    let i = "";

    plugin.usePlugin({
      name: "test1",
      hooks: {
        a() {
          i += "a";
        },
      },
    });

    plugin.usePlugin({
      name: "test2",
      hooks: {
        a() {
          this;
          i += "b";
        },
      },
    });

    plugin.hooks.a.emit();
    expect(i).toBe("ab");

    i = "";
    plugin.removePlugin("test1");
    plugin.hooks.a.emit();
    expect(i).toBe("b");

    i = "";
    plugin.removePlugin("test2");
    plugin.hooks.a.emit();
    expect(i).toBe("");
  });

  it("Check this", () => {
    const context = {};
    const plugin = new PluginSystem({
      a: new SyncHook<[number], typeof context>(context),
    });

    plugin.usePlugin({
      name: "test",
      hooks: {
        a(n) {
          expect(n).toBe(1);
          expect(this).toBe(context);
        },
      },
      onceHooks: {
        a(n) {
          expect(n).toBe(1);
          expect(this).toBe(context);
        },
      },
    });

    plugin.hooks.a.emit(1);
  });

  it("Check this defaults to `null`", async () => {
    const plugin = new PluginSystem({
      a: new SyncHook<[number]>(),
    });

    plugin.usePlugin({
      name: "test",
      hooks: {
        a(n) {
          expect(n).toBe(1);
          expect(this).toBe(null);
        },
      },
    });

    plugin.hooks.a.emit(1);
  });

  it("Type test", async () => {
    const plugin = new PluginSystem({
      syncHook: new SyncHook<[string, number]>(),
      asyncHook: new AsyncHook<[string, number]>(),
      asyncParallelHook: new AsyncParallelHook<[{ value: number }]>(),
      syncWaterfallHook: new SyncWaterfallHook<{ value: number }>(),
      asyncWaterfallHook: new AsyncWaterfallHook<{ value: number }>(),
    });

    plugin.usePlugin({
      name: "test",
      hooks: {
        syncHook(a, b) {
          expect(typeof a).toBe("string");
          expect(typeof b).toBe("number");
          return 1;
        },
        asyncHook(a, b) {
          expect(typeof a).toBe("string");
          expect(typeof b).toBe("number");
          return;
        },
        syncWaterfallHook(data) {
          expect(typeof data.value === "number").toBe(true);
          return data;
        },
        asyncWaterfallHook(data) {
          expect(typeof data.value === "number").toBe(true);
          return data;
        },
        asyncParallelHook(data) {
          expect(typeof data.value === "number").toBe(true);
          return;
        },
      },
    });

    const res1 = plugin.hooks.syncHook.emit("str", 2);
    expect(typeof res1 === "undefined").toBe(true);

    const res2 = plugin.hooks.syncWaterfallHook.emit({ value: 1 });
    expect(typeof res2.value === "number").toBe(true);

    await (async () => {
      const p = plugin.hooks.asyncHook.emit("str", 2);
      expect(typeof p.then === "function").toBe(true);
      const res = await p;
      if (res) {
        expect(typeof res === "undefined").toBe(true);
      }
    })();

    await (async () => {
      const p = plugin.hooks.asyncWaterfallHook.emit({ value: 1 });
      expect(typeof p.then === "function").toBe(true);
      const res = await p;
      if (res) {
        expect(typeof res.value === "number").toBe(true);
      }
    })();

    await (async () => {
      const p = plugin.hooks.asyncParallelHook.emit({ value: 1 });
      expect(typeof p.then === "function").toBe(true);
      const res = await p;
      expect(res).toBe(undefined);
    })();
  });
});
