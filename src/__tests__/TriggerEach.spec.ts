import {
  type Plugin,
  SyncHook,
  AsyncHook,
  SyncWaterfallHook,
  AsyncParallelHook,
  AsyncWaterfallHook,
  PluginSystem,
} from "../../index";

describe("TriggerEach", () => {
  it("Check SyncHook", () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[number], string>(""),
    });

    plSys.use({
      name: "test",
      hooks: {
        a(data) {
          expect(data).toBe(1);
        },
      },
    });

    let i = 0;
    const remove1 = plSys.beforeEach<[number], string>((e) => {
      expect(i).toBe(0);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "SyncHook",
        context: "",
        args: [1],
      });
    });

    const remove2 = plSys.afterEach<[number], string>((e) => {
      expect(i).toBe(1);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "SyncHook",
        context: "",
        args: [1],
      });
    });

    plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    remove2();
    plSys.lifecycle.a.emit(1);
    expect(i).toBe(1);

    i = 0;
    remove1();
    plSys.lifecycle.a.emit(1);
    expect(i).toBe(0);
  });

  it("Check SyncWaterfallHook", () => {
    const plSys = new PluginSystem({
      a: new SyncWaterfallHook<{ n: number }, string>(""),
    });

    plSys.use({
      name: "test",
      hooks: {
        a(data) {
          expect(data).toEqual({ n: 1 });
          return data;
        },
      },
    });

    let i = 0;
    const remove1 = plSys.beforeEach<[{ n: number }], string>((e) => {
      expect(i).toBe(0);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "SyncWaterfallHook",
        context: "",
        args: [{ n: 1 }],
      });
    });

    const remove2 = plSys.afterEach<[{ n: number }], string>((e) => {
      expect(i).toBe(1);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "SyncWaterfallHook",
        context: "",
        args: [{ n: 1 }],
      });
    });

    plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(2);

    i = 0;
    remove2();
    plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(1);

    i = 0;
    remove1();
    plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(0);
  });

  it("Check AsyncHook", async () => {
    const plSys = new PluginSystem({
      a: new AsyncHook<[number], string>(""),
    });

    plSys.use({
      name: "test",
      hooks: {
        async a(data) {
          expect(data).toBe(1);
        },
      },
    });

    let i = 0;
    const remove1 = plSys.beforeEach<[number], string>((e) => {
      expect(i).toBe(0);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncHook",
        context: "",
        args: [1],
      });
    });

    const remove2 = plSys.afterEach<[number], string>((e) => {
      expect(i).toBe(1);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncHook",
        context: "",
        args: [1],
      });
    });

    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    remove2();
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(1);

    i = 0;
    remove1();
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(0);
  });

  it("Check AsyncParallelHook", async () => {
    const plSys = new PluginSystem({
      a: new AsyncParallelHook<[number], string>(""),
    });

    plSys.use({
      name: "test",
      hooks: {
        async a(data) {
          expect(data).toEqual(1);
        },
      },
    });

    let i = 0;
    const remove1 = plSys.beforeEach<[number], string>((e) => {
      expect(i).toBe(0);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncParallelHook",
        context: "",
        args: [1],
      });
    });

    const remove2 = plSys.afterEach<[number], string>((e) => {
      expect(i).toBe(1);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncParallelHook",
        context: "",
        args: [1],
      });
    });

    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    remove2();
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(1);

    i = 0;
    remove1();
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(0);
  });

  it("Check AsyncWaterfallHook", async () => {
    const plSys = new PluginSystem({
      a: new AsyncWaterfallHook<{ n: number }, string>(""),
    });

    plSys.use({
      name: "test",
      hooks: {
        async a(data) {
          expect(data).toEqual({ n: 1 });
          return data;
        },
      },
    });

    let i = 0;
    const remove1 = plSys.beforeEach<[{ n: number }], string>((e) => {
      expect(i).toBe(0);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncWaterfallHook",
        context: "",
        args: [{ n: 1 }],
      });
    });

    const remove2 = plSys.afterEach<[{ n: number }], string>((e) => {
      expect(i).toBe(1);
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncWaterfallHook",
        context: "",
        args: [{ n: 1 }],
      });
    });

    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(2);

    i = 0;
    remove2();
    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(1);

    i = 0;
    remove1();
    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(0);
  });

  it("Once Hook (AsyncHook)", async () => {
    const plSys = new PluginSystem({
      a: new AsyncHook<[number], Record<string, never>>({}),
    });

    plSys.use({
      name: "test",
      onceHooks: {
        async a(data) {
          expect(data).toBe(1);
        },
      },
    });

    let i = 0;

    plSys.beforeEach<[number], Record<string, never>>((e) => {
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncHook",
        context: {},
        args: [1],
      });
    });

    plSys.afterEach<[number], Record<string, never>>((e) => {
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncHook",
        context: {},
        args: [1],
      });
    });

    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(0);
  });

  it("Once Hook (AsyncParallelHook)", async () => {
    const plSys = new PluginSystem({
      a: new AsyncParallelHook<[number], Record<string, never>>({}),
    });

    plSys.use({
      name: "test",
      onceHooks: {
        async a(data) {
          expect(data).toBe(1);
        },
      },
    });

    let i = 0;

    plSys.beforeEach<[number], Record<string, never>>((e) => {
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncParallelHook",
        context: {},
        args: [1],
      });
    });

    plSys.afterEach<[number], Record<string, never>>((e) => {
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncParallelHook",
        context: {},
        args: [1],
      });
    });

    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(0);
  });

  it("Once Hook (AsyncWaterfallHook)", async () => {
    const plSys = new PluginSystem({
      a: new AsyncWaterfallHook<{ n: number }, Record<string, never>>({}),
    });

    plSys.use({
      name: "test",
      onceHooks: {
        async a(data) {
          expect(data.n).toBe(1);
          return data;
        },
      },
    });

    let i = 0;

    plSys.beforeEach<[{ n: number }], Record<string, never>>((e) => {
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncWaterfallHook",
        context: {},
        args: [{ n: 1 }],
      });
    });

    plSys.afterEach<[{ n: number }], Record<string, never>>((e) => {
      i++;
      expect(e).toEqual({
        name: "a",
        type: "AsyncWaterfallHook",
        context: {},
        args: [{ n: 1 }],
      });
    });

    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(2);

    i = 0;
    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(0);
  });
});
