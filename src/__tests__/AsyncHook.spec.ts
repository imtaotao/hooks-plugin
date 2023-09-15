import { AsyncHook } from "../../index";

describe("AsyncHook", () => {
  it("Check return value", async () => {
    let i = 0;
    const hook = new AsyncHook<[string]>(null);
    expect(hook.type).toBe("AsyncHook");

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
    const hook = new AsyncHook<[void]>();
    const obj = { fn() {} };
    const spy = jest.spyOn(obj, "fn");
    hook.on(() => Promise.resolve(false));
    hook.on(obj.fn);

    const returnValue = await hook.emit();
    expect(returnValue).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("Check this", async () => {
    const context = {};
    const hook = new AsyncHook<[number], typeof context>(context);
    expect(hook.context === context).toBe(true);

    hook.on((a) => {
      expect(a).toBe(1);
      expect(this !== context).toBe(true);
    });

    hook.on(function (a) {
      expect(a).toBe(1);
      expect(this === context).toBe(true);
    });

    await hook.emit(1);
  });

  it("Check this defaults to `null`", async () => {
    const hook = new AsyncHook<[number]>();
    expect(hook.context).toBe(null);

    hook.on(function (a) {
      expect(a).toBe(1);
      expect(this).toBe(null);
    });

    await hook.emit(1);
  });
});
