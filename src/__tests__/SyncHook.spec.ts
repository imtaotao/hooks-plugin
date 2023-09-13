import { SyncHook } from "../../index";

describe("SyncHook", () => {
  it("Check order and results", () => {
    let i = 0;
    const hook = new SyncHook<[void], void>("test");
    expect(hook.type).toBe("test");

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
    const hook = new SyncHook<[number, string], void>();
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
});
