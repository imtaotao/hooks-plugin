import { AsyncWaterfallHook } from "../../index";

describe("AsyncWaterfallHook", () => {
  it("Check order, results and errors", async () => {
    const hook = new AsyncWaterfallHook<{ name: string }>(null, "test");
    expect(hook.type).toBe("test");

    hook.on(async (data) => {
      expect(data.name).toBe("chen");
      data.name += "1";
      return data;
    });

    hook.on((data) => {
      return new Promise((resolve) => {
        expect(data.name).toBe("chen1");
        data.name += "2";
        setTimeout(() => {
          resolve(data);
        }, 10);
      });
    });

    hook.once(async (data) => {
      expect(data.name).toBe("chen12");
      data.name += "3";
      return data;
    });

    let data = await hook.emit({ name: "chen" });
    expect(data).toEqual({ name: "chen123" });
    data = await hook.emit({ name: "chen" });
    expect(data).toEqual({ name: "chen12" });

    hook.removeAll();

    // @ts-ignore
    hook.on(async () => {
      return "";
    });
    hook.on(async (data) => {
      data.name += "2";
      return data;
    });

    let isError = false;
    try {
      await hook.emit({ name: "chen" });
    } catch {
      isError = true;
    }
    expect(isError).toBe(true);
  });

  it("Check the termination procedure", async () => {
    const hook = new AsyncWaterfallHook<{ n: number }>();
    expect(hook.type).toBe("AsyncWaterfallHook");

    hook.on((data) => {
      return data.n > 0 ? false : data;
    });
    hook.on((data) => {
      data.n++;
      return data;
    });

    let obj = { n: 0 };
    let data = await hook.emit(obj);
    expect(data).toEqual({ n: 1 });
    expect(obj === data).toBe(true);

    obj = { n: 1 };
    data = await hook.emit({ n: 1 });
    expect(data).toBe(false);
  });

  it("Check this", async () => {
    const data = {};
    const context = {};
    const hook = new AsyncWaterfallHook<Record<string, never>, typeof context>(
      context
    );
    expect(hook.context === context).toBe(true);

    hook.on((obj) => {
      expect(obj === data).toBe(true);
      expect(this !== context).toBe(true);
      return data;
    });

    hook.on(function (obj) {
      expect(obj === data).toBe(true);
      expect(this === context).toBe(true);
      return obj;
    });

    await hook.emit(data);
  });

  it("Check this defaults to `null`", async () => {
    const data = {};
    const hook = new AsyncWaterfallHook();
    expect(hook.context).toBe(null);

    hook.on(function (obj) {
      expect(obj === data).toBe(true);
      expect(this).toBe(null);
      return obj;
    });

    await hook.emit(data);
  });
});
