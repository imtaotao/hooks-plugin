<div align='center'>
<h2>hooks-plugin</h2>

[![NPM version](https://img.shields.io/npm/v/hooks-plugin.svg?color=a1b858&label=)](https://www.npmjs.com/package/hooks-plugin)

</div>

Plugin system built through various hooks, inspired by [tapable](https://github.com/webpack/tapable). it is very small, only having 300 lines after bundling, but it has fully-fledged and powerful TypeScript type hinting/type checking.


## Usage

Simple example

```ts
import { SyncHook, PluginSystem } from "hooks-plugin";

// Create a plugin and declare hooks
const plSys = new PluginSystem({
  a: new SyncHook<[string, number]>(),
});

// Register plugin
plSys.use({
  name: "testPlugin",
  hooks: {
    a(a, b) {
      console.log(a, b); // 'str', 1
    },
  },
});

// Trigger hook
plSys.lifecycle.a.emit("str", 1);
```


More complex example

```ts
import { AsyncHook, PluginSystem } from "hooks-plugin";

const plSys = new PluginSystem({
  // 1. The first generic is the parameter type received by the hook
  // 2. The second generic is the `this`` type of the hook function
  a: new AsyncHook<[number, number], string>("context"),

  // The parameter type of `AsyncWaterfallHook` and `SyncWaterfallHook` must be an object
  b: new AsyncWaterfallHook<{ value: number }, string>("context"),
});

plSys.use({
  name: "testPlugin",
  version: "1.0.0", // Optional
  hooks: {
    async a(a, b) {
      console.log(this); // 'context'
      console.log(a, b); // 1, 2
    },

    async b(data) {
      console.log(this); // 'context'
      console.log(data); // { value: 1 }
      return data;  // Must return values of the same type
    },
  },
  // The order is after `hooks` and will only be called once
  onceHooks: {
    async a(a, b) {
      console.log(this); // 'context'
      console.log(a, b); // 1, 2
    },
  }
});

plSys.lifecycle.a.emit(1, 2);
plSys.lifecycle.b.emit({ value: 1 });
```


Interact with other plugins

```ts
import { SyncHook, PluginSystem } from "hooks-plugin";

// Declare your plugin `api` type
declare module "hooks-plugin" {
  export interface PluginApis {
    testApis: (typeof plugin)["apis"];
  }
}

const plSys = new PluginSystem({});

const plugin = plSys.use({
  name: "testApis",
  apis: {
    get(key: string) {},
    set(key: string, value: unknown) {},
  },
});

const apis = plSys.getPluginApis("testApis");

apis.get("a");
apis.set("a", 1);
```


`beforeEach` and  `afterEach`.

```ts
import { SyncHook, PluginSystem } from "hooks-plugin";

const plSys = new PluginSystem({
  a: new SyncHook(),
});

plSys.use({
  name: "test",
  hooks: {
    a(data) {},
  },
});

// Registers a (sync) callback to be called before each hook is being called.
const removeBeforeEach = plSys.beforeEach((e) => {
  console.log("name:", e.name);
  console.log("type:", e.type);
  console.log("args:", e.args);
  console.log("context:", e.context);
});

// Registers a (sync) callback to be called after each hook is being called.
const removeAfterEach = plSys.afterEach((e) => {
  console.log("name:", e.name);
  console.log("type:", e.type);
  console.log("args:", e.args);
  console.log("context:", e.context);
});

plSys.lifecycle.a.emit(1);

// remove
removeBeforeEach();
removeAfterEach();

// Listening will no longer be triggered
plSys.lifecycle.a.emit(2);
```


## Hook list

- `SyncHook`
- `SyncWaterfallHook`
- `AsyncHook`
- `AsyncWaterfallHook`
- `AsyncParallelHook`


## Apis

- `plSys.use`
- `plSys.lock`
- `plSys.unlock`
- `plSys.remove`
- `plSys.beforeEach`
- `plSys.afterEach`
- `plSys.getPluginApis`


## CDN

```html
<!DOCTYPE html>
<html lang='en'>
<body>
  <script src='https://unpkg.com/hooks-plugin/dist/hooks.umd.js'></script>
  <script>
    const {
      PluginSystem,
      SyncHook,
      AsyncHook,
      SyncWaterfallHook,
      AsyncParallelHook,
      AsyncWaterfallHook,
    } = HooksPlugin;

    // ...
  </script>
</body>
</html>
```
