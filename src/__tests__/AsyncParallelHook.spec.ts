import {
  PluginSystem,
  AsyncParallelHook,
  AsyncWaterfallHook,
} from "../../index";

describe("AsyncParallelHook", () => {
  it("Check order, parameter and results", async () => {
    const plSys = new PluginSystem({
      // `AsyncWaterfallHook` will be queued for execution
      waterfall: new AsyncWaterfallHook<{ n: number }>(),
      // `AsyncParallelHook` will be executed in parallel
      parallel: new AsyncParallelHook<[{ n: number }]>(),
    });

    plSys.use({
      name: "test1",
      hooks: {
        waterfall(data) {
          return new Promise((resolve) => {
            setTimeout(() => {
              expect(data.n).toBe(0);
              data.n += 1;
              resolve(data);
            }, 30);
          });
        },
        parallel(data) {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              expect(data.n).toBe(3);
              data.n += 1;
              resolve();
            }, 30);
          });
        },
      },
    });

    plSys.use({
      name: "test2",
      hooks: {
        waterfall(data) {
          return new Promise((resolve) => {
            setTimeout(() => {
              expect(data.n).toBe(1);
              data.n += 1;
              resolve(data);
            }, 20);
          });
        },
        parallel(data) {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              expect(data.n).toBe(2);
              data.n += 1;
              resolve();
            }, 20);
          });
        },
      },
    });

    plSys.use({
      name: "test3",
      hooks: {
        waterfall(data) {
          return new Promise((resolve) => {
            setTimeout(() => {
              expect(data.n).toBe(2);
              data.n += 1;
              resolve(data);
            }, 10);
          });
        },
        parallel(data) {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              expect(data.n).toBe(1);
              data.n += 1;
              resolve();
            }, 10);
          });
        },
      },
    });

    plSys.use({
      name: "test4",
      hooks: {
        waterfall(data) {
          expect(data.n).toBe(3);
          data.n += 1;
          return data;
        },
        parallel(data) {
          expect(data.n).toBe(0);
          data.n += 1;
        },
      },
    });

    // parallel hook
    const data1 = { n: 0 };
    const task1 = plSys.lifecycle.parallel.emit(data1);

    expect(data1.n).toBe(0);
    expect(typeof task1.then === "function").toBe(true);
    const res1 = await task1;
    expect(res1).toBe(undefined);
    expect(data1.n).toBe(4);

    // waterfall hook
    const data2 = { n: 0 };
    const task2 = plSys.lifecycle.waterfall.emit(data2);

    expect(data2.n).toBe(0);
    const res2 = await task2;
    expect(data2.n).toBe(4);
    expect(res2 === data2).toBe(true);
  });

  it("Check type", async () => {
    expect(new AsyncParallelHook(null, "test").type).toBe("test");
    expect(new AsyncParallelHook().type).toBe("AsyncParallelHook");
  });

  it("Check this", async () => {
    const data = {};
    const context = {};
    const hook = new AsyncParallelHook<[Record<string, never>], typeof context>(
      context
    );
    expect(hook.context === context).toBe(true);

    hook.on((obj) => {
      expect(obj === data).toBe(true);
      expect(this !== context).toBe(true);
    });

    hook.on(function (obj) {
      expect(obj === data).toBe(true);
      expect(this === context).toBe(true);
    });

    await hook.emit(data);
  });

  it("Check this defaults to `null`", async () => {
    const data = {};
    const hook = new AsyncParallelHook<[Record<string, never>]>();
    expect(hook.context).toBe(null);

    hook.on(function (obj) {
      expect(obj === data).toBe(true);
      expect(this).toBe(null);
    });

    await hook.emit(data);
  });
});
