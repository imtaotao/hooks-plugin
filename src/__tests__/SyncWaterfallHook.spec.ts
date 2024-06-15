import { SyncWaterfallHook } from '../../index';

describe('SyncWaterfallHook', () => {
  it('Check results and order', () => {
    const hook = new SyncWaterfallHook<{ name: string }>(null);
    expect(hook.type).toBe('SyncWaterfallHook');

    hook.on((data) => {
      expect(data.name).toBe('chen');
      data.name += '1';
      return data;
    });

    hook.on((data) => {
      expect(data.name).toBe('chen1');
      data.name += '2';
      return data;
    });

    hook.once((data) => {
      expect(data.name).toBe('chen12');
      data.name += '3';
      return data;
    });

    let data = hook.emit({ name: 'chen' });
    expect(data).toEqual({ name: 'chen123' });
    data = hook.emit({ name: 'chen' });
    expect(data).toEqual({ name: 'chen12' });
  });

  it('check for errors', () => {
    const hook = new SyncWaterfallHook<{ name: string }>();
    expect(hook.type).toBe('SyncWaterfallHook');

    hook.on((() => {
      return '';
    }) as any);

    hook.on((data) => {
      data.name += '2';
      return data;
    });

    let e = false;
    hook.listenError(() => (e = true));
    hook.emit({ name: 'chen' });
    expect(e).toBe(true);
  });

  it('Check this', () => {
    const data = {};
    const context = {};
    const hook = new SyncWaterfallHook<Record<string, never>, typeof context>(
      context,
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

    hook.emit(data);
  });

  it('Check this defaults to `null`', () => {
    const data = {};
    const hook = new SyncWaterfallHook();
    expect(hook.context).toBe(null);

    hook.on(function (obj) {
      expect(obj === data).toBe(true);
      expect(this).toBe(null);
      return obj;
    });

    hook.emit(data);
  });

  it('Check add tag', () => {
    const hook = new SyncWaterfallHook<{ n: number }>();
    hook.on('tag', (data) => {
      expect(data).toEqual({ n: 1 });
      return data;
    });
    hook.emit({ n: 1 });
  });
});
