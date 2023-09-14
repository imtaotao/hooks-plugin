<div align='center'>
<h2>hooks-plugin</h2>

[![NPM version](https://img.shields.io/npm/v/hooks-plugin.svg?color=a1b858&label=)](https://www.npmjs.com/package/hooks-plugin)

</div>

Plugin system built through various hooks, a very small library, inspired by [tapable](https://github.com/webpack/tapable).


## Usage

Simple example

```ts
import { SyncHook, PluginSystem } from "hooks-plugin";

// Create a plugin and declare hooks
const plSys = new PluginSystem({
  a: new SyncHook<[string, number]>(),
});

// Register plugin
plSys.usePlugin({
  name: "testPlugin",
  hooks: {
    a(a, b) {
      console.log(a, b); // 'str', 1
    },
  },
});

// Trigger hook
plSys.hooks.a.emit("str", 1);
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

plSys.usePlugin({
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
});

plSys.hooks.a.emit(1, 2);
plSys.hooks.b.emit({ value: 1 });
```


## Hook list

- `SyncHook`
- `SyncWaterfallHook`
- `AsyncHook`
- `AsyncWaterfallHook`
- `AsyncParallelHook`


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
