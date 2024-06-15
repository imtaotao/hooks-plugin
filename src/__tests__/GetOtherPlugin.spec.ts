import { SyncHook, PluginSystem } from '../../index';

declare module '../../index' {
  interface PluginApis {
    testApis: (typeof plugin)['apis'];
  }
}

const data: Record<string, unknown> = {};

const plSys = new PluginSystem({
  a: new SyncHook<[number]>(),
});

const plugin = plSys.use({
  name: 'testApis',
  hooks: {
    a(data) {},
  },
  apis: {
    get(key: string) {
      return data[key];
    },
    set(key: string, value: unknown) {
      data[key] = value;
    },
  },
});

describe('GetOtherPlugin', () => {
  it('Get other plugin apis', () => {
    const apis = plSys.getPluginApis('testApis');
    apis.set('a', 1);
    expect(apis.get('a')).toBe(1);
  });
});
