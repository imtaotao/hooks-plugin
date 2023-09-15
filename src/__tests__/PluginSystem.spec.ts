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

  it("Check plugin version", () => {
    const plSys = new PluginSystem({});
    plSys.use({
      name: "test",
    });

    plSys.use({
      name: "test2",
      version: "1.0",
    });

    expect(plSys.plugins["test"].version === undefined).toBe(true);
    expect(plSys.plugins["test2"].version === "1.0").toBe(true);
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

  it("Plugin System lock and unlock", () => {
    const plSys = new PluginSystem({});
    plSys.use({ name: "test" });

    plSys.lock();

    expect(() => {
      plSys.use({ name: "test1" });
    }).toThrowError();
    expect(() => {
      plSys.remove("test");
    }).toThrowError();

    plSys.unlock();

    expect(() => {
      plSys.use({ name: "test1" });
    }).not.toThrowError();
    expect(() => {
      plSys.remove("test");
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
