1. defineAsyncComponent 解决什么问题？

delay	延迟多久显示 loading，默认 200ms，避免闪一下
defineAsyncComponent(() => import('./Foo.vue'))
dist/
defineAsyncComponent 负责把组件单独打包成一个文件
defineAsyncComponent 只是 Vue 运行时的包装器，它负责在组件需要渲染时调用 loader，并处理 loading / error / resolved 状态。
`defineAsyncComponent(() => import('./Foo.vue'))`
defineAsyncComponent	组件级	弹窗、图表、富文本、复杂面板
defineAsyncComponent 是 Vue 3 提供的异步组件包装 API，它把一个返回 Promise 的组件 loader 包装成普通 Vue 组件；运行时在组件真正渲染时执行 loader()，通过 import() 拉取异步 chunk，并用内部状态管理 loading、error、timeout、retry 和已解析组件缓存。真正负责代码分割的是构建工具识别动态 import()，不是 defineAsyncComponent 本身。

# defineAsyncComponent 是啥？如何实现异步加载？打包资源是什么样的？

---

## 1. defineAsyncComponent 解决什么问题？

它解决的是：**组件不要一开始就打进主包，而是在真正渲染到它的时候，再去加载这个组件对应的 JS chunk。**

比如一个后台系统：

```js
import BigChart from './BigChart.vue'
```

这样写，BigChart.vue 会进入首屏主包。哪怕用户暂时看不到这个图表组件，也会被提前下载、解析、执行。

改成：

```js
import { defineAsyncComponent } from 'vue'
const BigChart = defineAsyncComponent(() => import('./BigChart.vue'))
```

> 先注册一个“异步组件壳子”，真正要渲染 BigChart 时，再执行 `import('./BigChart.vue')` 去加载组件代码。

Vue 官方文档也是用 `defineAsyncComponent({ loader: () => import('./Foo.vue') })` 作为异步组件写法，并支持 `loadingComponent`、`errorComponent`、`delay`、`timeout` 等状态配置。

---

## 2. 核心流程图

```mermaid
flowchart TD
    A[页面初始加载] --> B[加载 main.js 主包]
    B --> C[遇到 defineAsyncComponent]
    C --> D[只创建 AsyncComponentWrapper 异步组件壳子]
    D --> E[不会立刻加载真实组件 Foo.vue]
    E --> F[当组件真正被渲染]
    F --> G[执行 loader()]
    G --> H[loader 内部执行 import('./Foo.vue')]
    H --> I[浏览器请求 Foo.xxx.js 异步 chunk]
    I --> J[Promise resolved]
    J --> K[拿到真实组件]
    K --> L[重新渲染，把 loading 占位换成真实组件]
```

---

## 3. 基本用法

### 最简单写法

```js
import { defineAsyncComponent } from 'vue'
const AsyncUserPanel = defineAsyncComponent(() => import('./UserPanel.vue'))
```

本质等价于：

```js
const AsyncUserPanel = defineAsyncComponent({
  loader: () => import('./UserPanel.vue')
})
```

### 完整配置写法

```js
import { defineAsyncComponent } from 'vue'
import Loading from './Loading.vue'
import ErrorView from './ErrorView.vue'
const AsyncUserPanel = defineAsyncComponent({
  loader: () => import('./UserPanel.vue'),
  loadingComponent: Loading,
  delay: 200,
  errorComponent: ErrorView,
  timeout: 3000,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      retry()
    } else {
      fail()
    }
  }
})
```

**字段说明：**

| 字段              | 作用                                   |
|-------------------|----------------------------------------|
| loader            | 返回 Promise 的加载函数，通常就是 () => import('./xxx.vue') |
| loadingComponent  | 加载期间展示的组件                     |
| delay             | 延迟多久显示 loading，默认 200ms，避免闪一下 |
| errorComponent    | 加载失败后展示的组件                   |
| timeout           | 超时多久算失败                         |
| onError           | 失败后的重试 / 放弃逻辑                |

---

## 4. 它是如何实现异步加载的？

> 关键点：Vue 不负责切包，Vue 只负责在渲染时调用 loader()。真正切包的是 Vite / Webpack / Rollup 这类构建工具。

### 4.1 把函数形式统一成对象形式

你写：

```js

```

源码会先变成：

```js
{
  loader: () => import('./Foo.vue')
}
```

### 4.2 内部维护三个核心状态

```js
let pendingRequest = null
let resolvedComp = undefined
let retries = 0
```

| 状态           | 作用                   |
|----------------|------------------------|
| pendingRequest | 当前正在加载中的 Promise，避免重复请求 |
| resolvedComp   | 已经加载成功的真实组件 |
| retries        | 重试次数               |

### 4.3 load() 负责执行真正的 loader

```js
function load() {
  return pendingRequest || (
    pendingRequest = loader()
      .then(comp => {
        if (comp.__esModule) {
          comp = comp.default
        }
        resolvedComp = comp
        return comp
      })
  )
}
```

重点：

1. 如果已经在加载中，直接复用 pendingRequest
2. loader() 执行后，才会触发 import('./Foo.vue')
3. 加载成功后，把真实组件缓存到 resolvedComp

### 4.4 返回的是一个包装组件：AsyncComponentWrapper

```js
return defineComponent({
  name: 'AsyncComponentWrapper',
  setup() {
    // 控制 loading / error / loaded
  }
})
```

渲染逻辑：

```js
if (loaded && resolvedComp) {
  return 真正的组件
} else if (error && errorComponent) {
  return 错误组件
} else if (loadingComponent && !delayed) {
  return 加载中组件
} else {
  return 空节点
}
```

---

## 5. 打包的时候资源是什么样的？

假设你有：

```js
// App.vue
const AsyncChart = defineAsyncComponent(() => import('./components/Chart.vue'))
```

构建后，大概会变成这种资源结构：

```text
index.html
assets/
  index-a1b2c3.js          # 主包
  Chart-d4e5f6.js          # 异步组件 chunk
  Chart-d4e5f6.css         # 这个异步组件用到的 CSS，视构建配置而定
```

主包里不会直接包含 Chart.vue 的完整代码，而是保留一个动态加载入口。

```js
const AsyncChart = defineAsyncComponent(() =>
  import('./Chart-d4e5f6.js')
)
```

当页面真的渲染到 AsyncChart 的时候，浏览器才会请求：

```
/assets/Chart-d4e5f6.js
```

如果这个异步组件有单独 CSS，Vite 会自动抽取异步 chunk 里用到的 CSS，并在对应异步 chunk 加载时通过 `<link>` 加载 CSS；Vite 还会对异步 chunk 的依赖做 preload 优化。

---

## 6. 注意：不是 defineAsyncComponent 自己把资源切开

> 真正导致异步 chunk 的是 `import('./Foo.vue')`，不是 defineAsyncComponent 这个 API 本身。

---

## 7. 和普通动态 import 的关系

你完全可以这样写：

```js
const loader = () => import('./Foo.vue')
```

这已经能让构建工具切包。但 Vue 需要一个组件，所以 defineAsyncComponent 做的是：

```text
Promise<Component>
  ↓
包装成 Vue 能识别的 Component
  ↓
管理加载中、失败、成功、重试、超时
```

本质：**动态 import + Vue 组件状态包装器**

---

## 8. 适合用在哪些场景？

**适合：**

- 首屏不需要的大组件
- 弹窗组件
- 图表组件
- 富文本编辑器
- 低频使用的业务模块
- 路由级页面组件
- 后台系统里的复杂配置面板

**不太适合：**

- 首屏一定会出现的小组件
- 体积很小、加载频率很高的基础组件
- 每个页面都必然使用的公共组件

> 异步加载虽然减少主包体积，但会多一次网络请求。不是所有组件都应该异步化。

---

## 9. 和 Vue Router 懒加载的区别

路由懒加载：

```js
{
  path: '/user',
  component: () => import('./views/User.vue')
}
```

组件懒加载：

```js
const UserCard = defineAsyncComponent(() => import('./UserCard.vue'))
```

| 类型                  | 粒度   | 典型场景                 |
|-----------------------|--------|--------------------------|
| 路由懒加载            | 页面级 | /user、/dashboard        |
| defineAsyncComponent  | 组件级 | 弹窗、图表、富文本、复杂面板 |

本质都依赖：

`import('./xxx.vue')`

---

## 10. 一句话总结

> defineAsyncComponent 是 Vue 3 提供的异步组件包装 API，它把一个返回 Promise 的组件 loader 包装成普通 Vue 组件；运行时在组件真正渲染时执行 loader()，通过 import() 拉取异步 chunk，并用内部状态管理 loading、error、timeout、retry 和已解析组件缓存。真正负责代码分割的是构建工具识别动态 import()，不是 defineAsyncComponent 本身。
动态 import + Vue 组件状态包装器

