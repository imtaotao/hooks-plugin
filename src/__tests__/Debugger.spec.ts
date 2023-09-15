import { SyncHook, AsyncParallelHook, PluginSystem } from "../../index";

describe("GetOtherPlugin", () => {
  beforeEach(() => {
    // Avoid unnecessary log messages
    jest.spyOn(console, "time").mockImplementation(() => {});
    jest.spyOn(console, "timeLog").mockImplementation(() => {});
    jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
    jest.spyOn(console, "groupEnd").mockImplementation(() => {});
  });

  it("Check receiver and close", async () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[number, number], string>("ctxA"),
      b: new AsyncParallelHook<[string], string>("ctxB"),
    });

    plSys.use({
      name: "test",
      hooks: {
        a(a, b) {
          expect(a).toBe(1);
          expect(b).toBe(2);
        },
        b(str) {
          expect(str).toBe("str");
          return new Promise((resolve) => {
            setTimeout(resolve, 300);
          });
        },
      },
    });

    plSys.use({
      name: "test2",
      hooks: {
        a(a, b) {
          expect(a).toBe(1);
          expect(b).toBe(2);
        },
        async b(str) {
          expect(str).toBe("str");
        },
      },
    });

    let i = 0;
    const close = plSys.debug({
      tag: "tag",
      receiver(data) {
        i++;
        expect(typeof data.tag === "string").toBe(true);
        expect(typeof data.time === "number").toBe(true);
        expect(data.e.id !== null).toBe(true);
        expect(Array.isArray(data.e.args)).toBe(true);
        expect(typeof data.e.name === "string").toBe(true);
        expect(typeof data.e.type === "string").toBe(true);
        expect(typeof data.e.context === "string").toBe(true);
      },
    });

    plSys.lifecycle.a.emit(1, 2);
    await plSys.lifecycle.b.emit("str");
    expect(i).toBe(2);

    i = 0;
    close();
    plSys.lifecycle.a.emit(1, 2);
    await plSys.lifecycle.b.emit("str");
    expect(i).toBe(0);
  });

  it("Check filter", async () => {
    const check = async (isStrFilter: boolean) => {
      const plSys = new PluginSystem({
        a: new SyncHook<[number, number], string>("ctxA"),
        b: new AsyncParallelHook<[string], string>("ctxB"),
      });

      plSys.use({
        name: "test",
        hooks: {
          a(a, b) {
            expect(a).toBe(1);
            expect(b).toBe(2);
          },
          async b(str) {
            expect(str).toBe("str");
          },
        },
      });

      plSys.use({
        name: "test2",
        hooks: {
          a(a, b) {
            expect(a).toBe(1);
            expect(b).toBe(2);
          },
          async b(str) {
            expect(str).toBe("str");
          },
        },
      });

      let i = 0;
      plSys.debug({
        tag: "tag",
        filter: isStrFilter
          ? "a" // filter `a`
          : (data) => {
              expect(typeof data.tag === "string").toBe(true);
              expect(typeof data.time === "number").toBe(true);
              expect(data.e.id !== null).toBe(true);
              expect(Array.isArray(data.e.args)).toBe(true);
              expect(typeof data.e.name === "string").toBe(true);
              expect(typeof data.e.type === "string").toBe(true);
              expect(typeof data.e.context === "string").toBe(true);
              return data.e.name === "a"; // filter `a`
            },

        receiver(data) {
          i++;
          expect(typeof data.tag === "string").toBe(true);
          expect(typeof data.time === "number").toBe(true);
          expect(data.e.id !== null).toBe(true);
          expect(Array.isArray(data.e.args)).toBe(true);
          expect(typeof data.e.name === "string").toBe(true);
          expect(typeof data.e.type === "string").toBe(true);
          expect(typeof data.e.context === "string").toBe(true);
        },
      });

      plSys.lifecycle.a.emit(1, 2);
      await plSys.lifecycle.b.emit("str");
      expect(i).toBe(1);
    };

    await check(true);
    await check(false);
  });

  it("Check call log fns", () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[number, number], string>("ctxA"),
    });

    plSys.use({
      name: "test",
      hooks: {
        a(a, b) {
          expect(a).toBe(1);
          expect(b).toBe(2);
        },
      },
    });

    const spyTime = jest.spyOn(console, "time");
    const spyTimeLog = jest.spyOn(console, "timeLog");
    const spyGroupCollapsed = jest.spyOn(console, "groupCollapsed");
    const spyGroupEnd = jest.spyOn(console, "groupEnd");

    const close = plSys.debug({
      tag: "tag",
      group: true,
    });

    plSys.lifecycle.a.emit(1, 2);
    expect(spyTime).toHaveBeenCalled();
    expect(spyTimeLog).toHaveBeenCalled();
    expect(spyGroupCollapsed).toHaveBeenCalled();
    expect(spyGroupEnd).toHaveBeenCalled();

    spyTime.mockRestore();
    spyTimeLog.mockRestore();
    spyGroupCollapsed.mockRestore();
    spyGroupEnd.mockRestore();

    close();
    plSys.lifecycle.a.emit(1, 2);

    expect(spyTime).not.toHaveBeenCalled();
    expect(spyTimeLog).not.toHaveBeenCalled();
    expect(spyGroupCollapsed).not.toHaveBeenCalled();
    expect(spyGroupEnd).not.toHaveBeenCalled();
  });

  it("Group is `false`", () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[number, number], string>("ctxA"),
    });

    plSys.use({
      name: "test",
      hooks: {
        a(a, b) {
          expect(a).toBe(1);
          expect(b).toBe(2);
        },
      },
    });

    const spyTime = jest.spyOn(console, "time");
    const spyTimeLog = jest.spyOn(console, "timeLog");
    const spyGroupCollapsed = jest.spyOn(console, "groupCollapsed");
    const spyGroupEnd = jest.spyOn(console, "groupEnd");

    plSys.debug({
      tag: "tag",
      group: false,
    });

    plSys.lifecycle.a.emit(1, 2);
    expect(spyTime).toHaveBeenCalled();
    expect(spyTimeLog).toHaveBeenCalled();
    expect(spyGroupCollapsed).not.toHaveBeenCalled();
    expect(spyGroupEnd).not.toHaveBeenCalled();
  });
});
