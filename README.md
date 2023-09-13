<div align='center'>
<h2>hooks-plugin</h2>

[![NPM version](https://img.shields.io/npm/v/hooks-plugin.svg?color=a1b858&label=)](https://www.npmjs.com/package/hooks-plugin)

</div>

Plugin system built through various hooks, a very small library inspired by [tapable](https://github.com/webpack/tapable).


## Usage


```ts
import { AsyncHook, PluginSystem } from 'hooks-plugin';

// Create a plugin and declare hooks
const hooks = new PluginSystem({
  // 1. The first generic is the parameter type received by the hook
  // 2. The second generic is the type returned by the hook function
  a: new AsyncHook<[number, number], void>(),
});

// Register plugin
hooks.usePlugin({
  name: 'testPlugin',
  async a(a, b) {
    console.log(a, b);
  },
});

// Trigger hook
hooks.lifecycle.a.emit(1, 2);
```


## Hook list

- `SyncHook`
- `AsyncHook`
- `SyncWaterfallHook`
- `AsyncParallelHook`
- `AsyncWaterfallHook`


## CDN

```html
<!DOCTYPE html>
<html lang='en'>
<body>
  <script src='https://unpkg.com/hooks-plugin/dist/hooks.umd.js'></script>
  <script>
    // ...
  </script>
</body>
</html>
```
