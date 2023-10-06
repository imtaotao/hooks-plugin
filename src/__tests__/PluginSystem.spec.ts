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
    const plSys = new PluginSystem({});
    expect(typeof plSys.v === "string").toBe(true);
  });

  it("Check use response", () => {
    const plugin = {
      name: "test",
      hooks: {},
    };
    const plSys = new PluginSystem({});
    expect(plSys.use(plugin) === plugin).toBe(true);
  });

  it("Check plugin version", () => {
    const plSys = new PluginSystem({});

    plSys.use({
      name: "test1",
      hooks: {},
    });

    plSys.use({
      name: "test2",
      version: "1.0",
      hooks: {},
    });

    expect(plSys.plugins["test1"].version === undefined).toBe(true);
    expect(plSys.plugins["test2"].version === "1.0").toBe(true);
  });

  it("Check plugin is function", () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[number], string>(""),
    });

    let i = 0;

    const plugin = plSys.use((pl) => {
      expect(pl === plSys).toBe(true);

      return {
        name: "test",
        version: "1.0",
        hooks: {
          a(data) {
            i++;
            expect(data).toBe(1);
            expect(this).toBe("");
          },
        },
        onceHooks: {
          a(data) {
            i++;
            expect(data).toBe(1);
            expect(this).toBe("");
          },
        },
      };
    });

    expect(plSys.plugins["test"] === plugin).toBe(true);
    expect(plugin.name === "test").toBe(true);
    expect(plugin.version === "1.0").toBe(true);
    expect(Object.keys(plugin.hooks)).toEqual(["a"]);
    expect(Object.keys(plugin.onceHooks)).toEqual(["a"]);

    plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);
  });

  it("Check parameter", () => {
    const plSys = new PluginSystem({
      a: new SyncHook(),
      b: new SyncHook(),
    });

    expect(() => {
      plSys.use([] as any);
    }).toThrowError();

    expect(() => {
      plSys.use({} as any);
    }).toThrowError();

    expect(() => {
      plSys.use({ name: 1 } as any);
    }).toThrowError();

    expect(() => {
      plSys.remove("");
    }).toThrowError();

    expect(() => {
      plSys.remove("a");
    }).not.toThrowError();

    expect(Object.keys(plSys.lifecycle)).toEqual(["a", "b"]);
  });

  it("Check for hooks declared not to exist", () => {
    const plSys = new PluginSystem({
      a: new SyncHook(),
    });

    expect(() => {
      plSys.use({
        name: "test",
        hooks: {
          b() {},
        },
      } as any);
    }).toThrowError();
  });

  it("Check once hooks", () => {
    const plSys = new PluginSystem({
      a: new SyncWaterfallHook<{ value: number }>(),
    });

    plSys.use({
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
    expect(plSys.lifecycle.a.emit({ value: 0 })).toEqual({ value: 2 });
    expect(plSys.lifecycle.a.emit({ value: 0 })).toEqual({ value: 1 });
    expect(plSys.lifecycle.a.emit({ value: 0 })).toEqual({ value: 1 });
  });

  it("Add plugin and remove plugin", () => {
    const plSys = new PluginSystem({
      a: new SyncHook(),
      b: new SyncHook(),
    });

    let i = 0;
    let j = 0;
    plSys.use({
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

    plSys.use({
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

    plSys.lifecycle.a.emit();
    expect(i).toBe(2);
    plSys.lifecycle.b.emit();
    expect(j).toBe(2);

    i = 0;
    j = 0;
    plSys.remove("test1");

    plSys.lifecycle.a.emit();
    expect(i).toBe(1);
    plSys.lifecycle.b.emit();
    expect(j).toBe(1);
  });

  it("Repeat add plugin", () => {
    const plSys = new PluginSystem({});

    plSys.use({
      name: "test",
      hooks: {},
    });

    expect(() => {
      plSys.use({
        name: "test",
        hooks: {},
      });
    }).toThrowError();
  });

  it("Plugin System lock and unlock", () => {
    const plSys = new PluginSystem({
      a: new SyncHook(),
    });
    plSys.use({ name: "test", hooks: {} });

    const close = plSys.debug();
    const monitor = plSys.performance("0");

    plSys.lock();

    expect(() => {
      plSys.use({ name: "test1", hooks: {} });
    }).toThrowError();

    expect(() => {
      plSys.remove("test");
    }).toThrowError();

    expect(() => {
      plSys.beforeEach(() => {});
    }).toThrowError();

    expect(() => {
      plSys.afterEach(() => {});
    }).toThrowError();

    expect(() => {
      plSys.debug();
    }).toThrowError();

    expect(() => {
      close();
    }).toThrowError();

    expect(() => {
      plSys.performance("0");
    }).toThrowError();

    expect(() => {
      monitor.close();
    }).toThrowError();

    expect(() => {
      plSys.lifecycle.a.on(() => {});
    }).toThrowError();

    plSys.unlock();

    expect(() => {
      plSys.use({ name: "test1", hooks: {} });
    }).not.toThrowError();

    expect(() => {
      plSys.remove("test");
    }).not.toThrowError();

    expect(() => {
      close();
    }).not.toThrowError();

    expect(() => {
      monitor.close();
    }).not.toThrowError();
  });

  it("Data check", () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[string], void>(),
    });

    const obj: Plugin<typeof plSys.lifecycle> = {
      name: "test",
      hooks: {
        a(s) {
          expect(s).toBe("chen");
        },
      },
    };
    const spy = jest.spyOn(obj.hooks!, "a");
    plSys.use(obj);
    plSys.lifecycle.a.emit("chen");

    expect(spy).toHaveBeenCalled();
    spy.mockReset();
    spy.mockRestore();
  });

  it("Remove plugin", () => {
    const plSys = new PluginSystem({
      a: new SyncHook(),
    });

    let i = "";

    plSys.use({
      name: "test1",
      hooks: {
        a() {
          i += "a";
        },
      },
    });

    plSys.use({
      name: "test2",
      hooks: {
        a() {
          this;
          i += "b";
        },
      },
    });

    plSys.lifecycle.a.emit();
    expect(i).toBe("ab");

    i = "";
    plSys.remove("test1");
    plSys.lifecycle.a.emit();
    expect(i).toBe("b");

    i = "";
    plSys.remove("test2");
    plSys.lifecycle.a.emit();
    expect(i).toBe("");
  });

  it("Check this", () => {
    const context = {};
    const plSys = new PluginSystem({
      a: new SyncHook<[number], typeof context>(context),
    });

    plSys.use({
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

    plSys.lifecycle.a.emit(1);
  });

  it("Check this defaults to `null`", async () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[number]>(),
    });

    plSys.use({
      name: "test",
      hooks: {
        a(n) {
          expect(n).toBe(1);
          expect(this).toBe(null);
        },
      },
    });

    plSys.lifecycle.a.emit(1);
  });

  it("Clone pluginSystem", async () => {
    let i = 0;

    const plSys = new PluginSystem({
      a: new SyncHook<[number], string>("ctx"),
      b: new AsyncParallelHook<[number], Record<string, never>>({}),
    });

    plSys.use({
      name: "test",
      hooks: {
        a(data) {
          expect(data).toBe(1);
          i++;
        },
        async b(data) {
          expect(data).toBe(2);
          i++;
        },
      },
    });

    plSys.use({
      name: "test2",
      hooks: {
        a(data) {
          expect(data).toBe(1);
          i++;
        },
        async b(data) {
          expect(data).toBe(2);
          i++;
        },
      },
    });

    plSys.lifecycle.a.emit(1);
    await plSys.lifecycle.b.emit(2);
    expect(i).toBe(4);

    i = 0;
    const cloned1 = plSys.clone();
    cloned1.lifecycle.a.emit(1);
    await cloned1.lifecycle.b.emit(2);
    expect(i).toBe(0);

    i = 0;
    const cloned2 = plSys.clone(true);
    cloned2.lifecycle.a.emit(1);
    await cloned2.lifecycle.b.emit(2);
    expect(i).toBe(4);

    // Use new plugin
    cloned2.use({
      name: "test3",
      hooks: {
        a(data) {
          expect(data).toBe(1);
          i++;
        },
        async b(data) {
          expect(data).toBe(2);
          i++;
        },
      },
    });

    i = 0;
    cloned2.lifecycle.a.emit(1);
    await cloned2.lifecycle.b.emit(2);
    expect(i).toBe(6);
  });

  it("Check create new pluginSystem", () => {
    const plSys = new PluginSystem().create((hooks) => {
      return {
        a: new hooks.SyncHook<[number], string>("ctx"),
      };
    });

    let i = 0;

    plSys.use({
      name: "test",
      hooks: {
        a(data) {
          i++;
          expect(data).toBe(1);
          expect(this).toBe("ctx");
        },
      },
    });

    plSys.lifecycle.a.emit(1);
    expect(i).toBe(1);
  });

  it("Check `isUsed`", () => {
    const plSys = new PluginSystem();

    plSys.use({
      name: "test",
      hooks: {},
    });

    expect(() => {
      (plSys as any).isUsed();
    }).toThrowError();

    expect(plSys.isUsed("test")).toBe(true);
    expect(plSys.isUsed("test1")).toBe(false);
    expect(plSys.isUsed("toString")).toBe(false);
  });

  it("Type test", async () => {
    const plSys = new PluginSystem({
      syncHook: new SyncHook<[string, number]>(),
      asyncHook: new AsyncHook<[string, number]>(),
      asyncParallelHook: new AsyncParallelHook<[{ value: number }]>(),
      syncWaterfallHook: new SyncWaterfallHook<{ value: number }>(),
      asyncWaterfallHook: new AsyncWaterfallHook<{ value: number }>(),
    });

    plSys.use({
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

    const res1 = plSys.lifecycle.syncHook.emit("str", 2);
    expect(typeof res1 === "undefined").toBe(true);

    const res2 = plSys.lifecycle.syncWaterfallHook.emit({ value: 1 });
    expect(typeof res2.value === "number").toBe(true);

    await (async () => {
      const p = plSys.lifecycle.asyncHook.emit("str", 2);
      expect(typeof p.then === "function").toBe(true);
      const res = await p;
      if (res) {
        expect(typeof res === "undefined").toBe(true);
      }
    })();

    await (async () => {
      const p = plSys.lifecycle.asyncWaterfallHook.emit({ value: 1 });
      expect(typeof p.then === "function").toBe(true);
      const res = await p;
      if (res) {
        expect(typeof res.value === "number").toBe(true);
      }
    })();

    await (async () => {
      const p = plSys.lifecycle.asyncParallelHook.emit({ value: 1 });
      expect(typeof p.then === "function").toBe(true);
      const res = await p;
      expect(res).toBe(undefined);
    })();
  });
});
