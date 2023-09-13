import { AsyncHook } from "../../index";

describe("AsyncHook", () => {
  it("Check return value", async () => {
    let i = 0;
    const hook = new AsyncHook<[string]>("test");
    expect(hook.type).toBe("test");

    hook.on(async (a) => {
      expect(i).toBe(0);
      expect(a).toBe("1");
      i++;
    });
    hook.on((a) => {
      expect(a).toBe("1");
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(i).toBe(1);
          i++;
          resolve();
        });
      });
    });
    hook.on((a) => {
      expect(a).toBe("1");
      expect(i).toBe(2);
      i++;
    });

    await hook.emit("1");
    expect(i).toBe(3);
  });

  it("Check execution order", async () => {
    let i = 0;
    const hook = new AsyncHook();
    expect(hook.type).toBe("AsyncHook");

    hook.once(() => {
      i++;
      return false;
    });

    hook.on(() => {
      i++;
    });

    await hook.emit();
    expect(i).toBe(1);
    await hook.emit();
    expect(i).toBe(2);

    hook.once(async () => {
      return false as false;
    });
    hook.on(() => {
      i++;
    });

    await hook.emit();
    expect(i).toBe(3);
    await hook.emit();
    expect(i).toBe(5);
  });

  it("Check asynchronous response", async () => {
    const hook = new AsyncHook<unknown, number>();
    hook.on(() => Promise.resolve(1));
    const returnValue = await hook.emit();
    expect(returnValue).toBe(1);
  });
});
