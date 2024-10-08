import { SyncHook, AsyncHook, PluginSystem } from '../../index';

describe('Performance', () => {
  const timeout = (fn: () => void, t: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        fn();
        resolve();
      }, t);
    });
  };

  it('Multiple monitoring', async () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[{ name: string }], string>(''),
      b: new AsyncHook<[{ name: string }], string>(''),
    });

    let i = 0;
    const p = plSys.performance('[0].name');

    p.monitor('a', 'a').on((e) => {
      i++;
      expect(typeof e.time === 'number').toBe(true);
      expect(e.events).toEqual(['a', 'a']);
      expect(e.endContext).toBe('');
      expect(e.endArgs).toEqual([{ name: 'n1' }]);
      expect(e.equalValue).toBe('n1');
    });

    p.monitor('a', 'b').on((e) => {
      i++;
      expect(typeof e.time === 'number').toBe(true);
      expect(e.events).toEqual(['a', 'b']);
      expect(e.endContext).toBe('');
      expect(e.equalValue === 'n' || e.equalValue === 'n1').toBe(true);
    });

    plSys.lifecycle.a.emit({ name: 'n1' });

    const p1 = timeout(() => {
      plSys.lifecycle.a.emit({ name: 'n1' });
    }, 10);

    const p2 = timeout(() => {
      plSys.lifecycle.a.emit({ name: 'n' });
      plSys.lifecycle.b.emit({ name: 'n1' });
      plSys.lifecycle.b.emit({ name: 'n' });
    }, 20);

    await Promise.all([p1, p2]);
    expect(i).toBe(3);
  });

  it('Multiple conditions', async () => {
    const plSys = new PluginSystem({
      a: new SyncHook<[{ name: string }]>(),
      b: new AsyncHook<[{ name1?: string; name?: string }]>(),
    });

    let i = 0;
    const p = plSys.performance('[0].name');

    p.monitor('a', 'a').on((e) => {
      i++;
      expect(typeof e.time === 'number').toBe(true);
      expect(e.events).toEqual(['a', 'a']);
      expect(e.equalValue).toBe('n1');
      expect(e.endContext).toBe(null);
    });

    p.monitor('a', 'b', { b: '[0].name1' }).on((e) => {
      i++;
      expect(typeof e.time === 'number').toBe(true);
      expect(e.events).toEqual(['a', 'b']);
      expect(e.equalValue).toBe('n');
      expect(e.endContext).toBe(null);
    });

    plSys.lifecycle.a.emit({ name: 'n1' });

    const p1 = timeout(() => {
      plSys.lifecycle.a.emit({ name: 'n1' });
    }, 10);

    const p2 = timeout(() => {
      plSys.lifecycle.a.emit({ name: 'n' });
      plSys.lifecycle.b.emit({ name: 'n1' });
      plSys.lifecycle.b.emit({ name1: 'n' });
    }, 20);

    await Promise.all([p1, p2]);
    expect(i).toBe(2);
  });

  it('Close monitor', async () => {
    const plSys = new PluginSystem({
      a: new SyncHook(),
      b: new AsyncHook(),
    });

    let i = 0;
    const p = plSys.performance('[0].name');

    p.monitor('a', 'a').on(() => {
      i++;
    });

    p.monitor('a', 'b').on(() => {
      i++;
    });

    p.close();

    expect(() => {
      p.monitor('a', 'a').on(() => {});
    }).toThrowError();

    plSys.lifecycle.a.emit();

    const p1 = timeout(() => {
      plSys.lifecycle.a.emit();
    }, 10);

    const p2 = timeout(() => {
      plSys.lifecycle.a.emit();
      plSys.lifecycle.b.emit();
      plSys.lifecycle.b.emit();
    }, 20);

    await Promise.all([p1, p2]);
    expect(i).toBe(0);
  });

  it('Remove all monitor', async () => {
    const plSys = new PluginSystem({
      a: new SyncHook(),
      b: new AsyncHook(),
    });

    let i = 0;
    const p = plSys.performance('[0].name');

    p.monitor('a', 'a').on(() => {
      i++;
    });

    p.monitor('a', 'b').on(() => {
      i++;
    });

    plSys.removeAllPerformance();

    expect(() => {
      p.monitor('a', 'a').on(() => {});
    }).toThrowError();

    plSys.lifecycle.a.emit();

    const p1 = timeout(() => {
      plSys.lifecycle.a.emit();
    }, 10);

    const p2 = timeout(() => {
      plSys.lifecycle.a.emit();
      plSys.lifecycle.b.emit();
      plSys.lifecycle.b.emit();
    }, 20);

    await Promise.all([p1, p2]);
    expect(i).toBe(0);
  });

  it('Check eque value is object', async () => {
    const check = async (data?: Record<string, never>) => {
      const plSys = new PluginSystem({
        a: new SyncHook<[{ a: Record<string, never> }]>(),
        b: new AsyncHook<[{ a: Record<string, never> }]>(),
      });

      let i = 0;
      const p = plSys.performance('[0].a');

      p.monitor('a', 'a').on(() => {
        i++;
      });

      p.monitor('a', 'b').on(() => {
        i++;
      });

      plSys.lifecycle.a.emit({ a: data || {} });

      const p1 = timeout(() => {
        plSys.lifecycle.a.emit({ a: data || {} });
      }, 10);

      const p2 = timeout(() => {
        plSys.lifecycle.a.emit({ a: data || {} });
        plSys.lifecycle.b.emit({ a: data || {} });
        plSys.lifecycle.b.emit({ a: data || {} });
      }, 20);

      await Promise.all([p1, p2]);
      expect(i).toBe(data ? 4 : 0);
    };

    await check();
    await check({});
  });

  it('Check 0 args', () => {
    let i = 0;
    const plSys = new PluginSystem({
      a: new SyncHook<[string]>(),
      b: new AsyncHook<[string]>(),
    });
    const p = plSys.performance('[0]');

    p.monitor('a', 'b').on(() => {
      i++;
    });

    plSys.lifecycle.a.emit('str');
    plSys.lifecycle.b.emit('str');
    expect(i).toBe(1);
  });
});
