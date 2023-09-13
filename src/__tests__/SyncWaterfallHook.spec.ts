import { SyncWaterfallHook } from "../../index";

describe("SyncWaterfallHook", () => {
  it("Check results and order", () => {
    const hook = new SyncWaterfallHook<{ name: string }>("test");
    expect(hook.type).toBe("test");

    hook.on((data) => {
      expect(data.name).toBe("chen");
      data.name += "1";
      return data;
    });

    hook.on((data) => {
      expect(data.name).toBe("chen1");
      data.name += "2";
      return data;
    });

    hook.once((data) => {
      expect(data.name).toBe("chen12");
      data.name += "3";
      return data;
    });

    let data = hook.emit({ name: "chen" });
    expect(data).toEqual({ name: "chen123" });
    data = hook.emit({ name: "chen" });
    expect(data).toEqual({ name: "chen12" });
  });

  it("check for errors", () => {
    const hook = new SyncWaterfallHook<{ name: string }>();
    expect(hook.type).toBe("SyncWaterfallHook");

    // @ts-ignore
    hook.on(() => {
      return "";
    });

    hook.on((data) => {
      data.name += "2";
      return data;
    });

    expect(() => hook.emit({ name: "chen" })).toThrowError();
  });
});
