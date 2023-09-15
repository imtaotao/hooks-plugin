import { SyncHook } from "../../index";

describe("SyncHook", () => {
  it("Check order", () => {
    let i = 0;
    const hook = new SyncHook<[void]>(null);
    expect(hook.type).toBe("SyncHook");

    hook.on(() => {
      i++;
    });

    hook.once(() => {
      i++;
    });

    hook.emit();
    expect(i).toBe(2);
    hook.emit();
    expect(i).toBe(3);
    hook.removeAll();
    hook.emit();
    expect(i).toBe(3);

    const fn = () => {
      i++;
    };

    hook.on(fn);
    hook.emit();
    expect(i).toBe(4);
    hook.remove(fn);
    hook.emit();
    expect(i).toBe(4);
  });

  it("Check multiple parameters", () => {
    const hook = new SyncHook<[number, string]>();
    expect(hook.type).toBe("SyncHook");

    hook.on((a, b) => {
      expect(a).toBe(1);
      expect(b).toBe("1");
    });

    hook.once((a, b) => {
      expect(a).toBe(1);
      expect(b).toBe("1");
    });

    hook.emit(1, "1");
  });

  it("Clone", () => {
    const context = {};
    const hook = new SyncHook<[number, string], Record<string, never>>(context);
    hook.on(() => {});
    const cloned1 = hook.clone();

    expect(cloned1.type).toBe("SyncHook");
    expect(cloned1.context).toBe(context);
    expect(hook.listeners.size).toBe(1);
    expect(cloned1.listeners.size).toBe(0);
    expect(cloned1.before !== undefined).toBe(true);

    const cloned2 = hook.before!.clone();
    expect(cloned2.type).toBe("SyncHook");
    expect(cloned2.before === undefined).toBe(true);
  });

  it("Check this", () => {
    const context = {};
    const hook = new SyncHook<[number], typeof context>(context);
    expect(hook.context === context).toBe(true);

    hook.on((a) => {
      expect(a).toBe(1);
      expect(this !== context).toBe(true);
    });

    hook.on(function (a) {
      expect(a).toBe(1);
      expect(this === context).toBe(true);
    });

    hook.emit(1);
  });

  it("Check this is empty value", () => {
    const hook = new SyncHook<[number], string>("");
    expect(hook.context === "").toBe(true);

    hook.on(function (a) {
      expect(a).toBe(1);
      expect(this === "").toBe(true);
    });

    hook.emit(1);
  });

  it("Check this defaults to `null`", () => {
    const hook = new SyncHook<[number]>();
    expect(hook.context).toBe(null);

    hook.on(function (a) {
      expect(a).toBe(1);
      expect(this).toBe(null);
    });

    hook.emit(1);
  });
});
