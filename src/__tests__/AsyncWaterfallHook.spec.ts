import { AsyncWaterfallHook } from "../../index";

describe("AsyncWaterfallHook", () => {
  it("Check order, results and errors", async () => {
    const hook = new AsyncWaterfallHook<{ name: string }>("test");
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
});
