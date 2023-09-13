import {
  PluginSystem,
  AsyncParallelHook,
  AsyncWaterfallHook,
} from "../../index";

describe("AsyncParallelHook", () => {
  it("Check order, parameter and results", async () => {
    const plugin = new PluginSystem({
      // `AsyncWaterfallHook` will be queued for execution
      waterfall: new AsyncWaterfallHook<{ n: number }>(),
      // `AsyncParallelHook` will be executed in parallel
      parallel: new AsyncParallelHook<{ n: number }>(),
    });

    plugin.usePlugin({
      name: "test1",

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
    });

    plugin.usePlugin({
      name: "test2",
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
    });

    plugin.usePlugin({
      name: "test3",
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
    });

    plugin.usePlugin({
      name: "test4",
      waterfall(data) {
        expect(data.n).toBe(3);
        data.n += 1;
        return data;
      },
      parallel(data) {
        expect(data.n).toBe(0);
        data.n += 1;
      },
    });

    // parallel hook
    const data1 = { n: 0 };
    const task1 = plugin.lifecycle.parallel.emit(data1);

    expect(data1.n).toBe(0);
    const res1 = await task1;
    expect(data1.n).toBe(4);
    expect(res1 === data1).toBe(true);

    // waterfall hook
    const data2 = { n: 0 };
    const task2 = plugin.lifecycle.waterfall.emit(data2);

    expect(data2.n).toBe(0);
    const res2 = await task2;
    expect(data2.n).toBe(4);
    expect(res2 === data2).toBe(true);
  });

  it("Check type", async () => {
    expect(new AsyncParallelHook("test").type).toBe("test");
    expect(new AsyncParallelHook().type).toBe("AsyncParallelHook");
  });
});
