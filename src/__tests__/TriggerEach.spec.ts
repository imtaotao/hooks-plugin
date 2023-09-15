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
    const unsubscribeBefore = plSys.beforeEach<[number], string>((e) => {
      expect(i).toBe(0);
      expect(e.name).toBe("a");
      expect(e.type).toBe("SyncHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    const unsubscribeAfter = plSys.afterEach<[number], string>((e) => {
      expect(i).toBe(1);
      expect(e.name).toBe("a");
      expect(e.type).toBe("SyncHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    unsubscribeAfter();
    plSys.lifecycle.a.emit(1);
    expect(i).toBe(1);

    i = 0;
    unsubscribeBefore();
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
    const unsubscribeBefore = plSys.beforeEach<[{ n: number }], string>((e) => {
      expect(i).toBe(0);
      expect(e.name).toBe("a");
      expect(e.type).toBe("SyncWaterfallHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([{ n: 1 }]);
      i++;
    });

    const unsubscribeAfter = plSys.afterEach<[{ n: number }], string>((e) => {
      expect(i).toBe(1);
      expect(e.name).toBe("a");
      expect(e.type).toBe("SyncWaterfallHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([{ n: 1 }]);
      i++;
    });

    plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(2);

    i = 0;
    unsubscribeAfter();
    plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(1);

    i = 0;
    unsubscribeBefore();
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
    const unsubscribeBefore = plSys.beforeEach<[number], string>((e) => {
      expect(i).toBe(0);
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    const unsubscribeAfter = plSys.afterEach<[number], string>((e) => {
      expect(i).toBe(1);
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    unsubscribeAfter();
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(1);

    i = 0;
    unsubscribeBefore();
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
    const unsubscribeBefore = plSys.beforeEach<[number], string>((e) => {
      expect(i).toBe(0);
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncParallelHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    const unsubscribeAfter = plSys.afterEach<[number], string>((e) => {
      expect(i).toBe(1);
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncParallelHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);

    i = 0;
    unsubscribeAfter();
    await plSys.lifecycle.a.emit(1);
    expect(i).toBe(1);

    i = 0;
    unsubscribeBefore();
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
    const unsubscribeBefore = plSys.beforeEach<[{ n: number }], string>((e) => {
      expect(i).toBe(0);
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncWaterfallHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([{ n: 1 }]);
      i++;
    });

    const unsubscribeAfter = plSys.afterEach<[{ n: number }], string>((e) => {
      expect(i).toBe(1);
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncWaterfallHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([{ n: 1 }]);
      i++;
    });

    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(2);

    i = 0;
    unsubscribeAfter();
    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(1);

    i = 0;
    unsubscribeBefore();
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
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncHook");
      expect(e.context).toEqual({});
      expect(e.args).toEqual([1]);
      i++;
    });

    plSys.afterEach<[number], Record<string, never>>((e) => {
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncHook");
      expect(e.context).toEqual({});
      expect(e.args).toEqual([1]);
      i++;
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
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncParallelHook");
      expect(e.context).toEqual({});
      expect(e.args).toEqual([1]);
      i++;
    });

    plSys.afterEach<[number], Record<string, never>>((e) => {
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncParallelHook");
      expect(e.context).toEqual({});
      expect(e.args).toEqual([1]);
      i++;
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
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncWaterfallHook");
      expect(e.context).toEqual({});
      expect(e.args).toEqual([{ n: 1 }]);
      i++;
    });

    plSys.afterEach<[{ n: number }], Record<string, never>>((e) => {
      expect(e.name).toBe("a");
      expect(e.type).toBe("AsyncWaterfallHook");
      expect(e.context).toEqual({});
      expect(e.args).toEqual([{ n: 1 }]);
      i++;
    });

    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(2);

    i = 0;
    await plSys.lifecycle.a.emit({ n: 1 });
    expect(i).toBe(0);
  });

  it("Check taskId", () => {
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
    let id: unknown;

    plSys.beforeEach<[number], string>((e) => {
      id = e.id;
      expect(i).toBe(0);
      expect(e.name).toBe("a");
      expect(e.type).toBe("SyncHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    plSys.afterEach<[number], string>((e) => {
      expect(i).toBe(1);
      expect(id === e.id).toBe(true);
      expect(e.name).toBe("a");
      expect(e.type).toBe("SyncHook");
      expect(e.context).toBe("");
      expect(e.args).toEqual([1]);
      i++;
    });

    plSys.lifecycle.a.emit(1);
    expect(i).toBe(2);
  });
});
