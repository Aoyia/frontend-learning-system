---
title: Vue 3 provide / inject 原理：provides 原型链与依赖注入
difficulty: 困难
tags: [vue, provide-inject, dependency-injection, source-code]
module: vue
order: 4
---

# Vue 3 provide / inject 原理：provides 原型链与依赖注入

## 1. 它解决什么问题？

`provide / inject` 解决的是**跨层级传值**问题，也就是常说的 `props drilling`。

假设组件层级很深：

```txt
App
└─ Layout
   └─ Page
      └─ Form
         └─ DeepInput
```

如果 `DeepInput` 需要使用 `theme`、`formContext`、`userInfo` 这类上下文数据，正常用 `props` 的话，需要一层层往下传：

```txt
App -> Layout -> Page -> Form -> DeepInput
```

但中间的 `Layout`、`Page`、`Form` 可能根本不关心这些数据，它们只是被迫做中转。

这时候可以用：

```ts
// 祖先组件
provide('theme', theme)

// 深层后代组件
const theme = inject('theme')
```

一句话：`provide / inject` 是 Vue 提供的依赖注入机制，用来让祖先组件向任意深度的后代组件提供数据，避免一层层传 `props`。

Vue 官方文档也把它放在 `Prop Drilling` 场景下解释：父组件可以作为依赖提供者，后代树里的任意深度组件都可以注入这些依赖。

## 2. 核心流程

```txt
组件创建
  ↓
每个组件实例都有 instance.provides
  ↓
默认情况下：子组件.provides = 父组件.provides
  ↓
某个组件第一次调用 provide
  ↓
Vue 创建一个新对象：当前组件.provides = Object.create(父组件.provides)
  ↓
把 key / value 存到当前组件自己的 provides 上
  ↓
后代组件 inject(key)
  ↓
从父组件的 provides 开始查找
  ↓
利用 JavaScript 原型链向上查找
  ↓
找到最近的 provider
```

核心一句话：==Vue 3 的 provide / inject 本质上是组件实例上的 `provides` 对象 + JavaScript 原型链查找。==

## 3. 核心数据结构

Vue 3 每个组件实例上都有一个 `provides` 字段：

```ts
instance.provides
```

它用来保存当前组件向后代提供的数据。

组件实例创建时，大致逻辑是：

```ts
provides: parent
  ? parent.provides
  : Object.create(appContext.provides)
```

含义是：

- 如果当前组件有父组件，默认复用父组件的 `provides`
- 如果当前组件是根组件，则基于 `appContext.provides` 创建
- `app.provide()` 提供的是应用级别依赖，会放到 `appContext.provides`

这解释了为什么组件内部的 `inject()` 也能拿到 `app.provide()` 提供的数据。

## 4. provide 是如何实现的？

`provide` 的核心逻辑可以简化成这样：

```ts
function provide(key: string | symbol, value: unknown) {
  const instance = currentInstance
  let provides = instance.provides
  const parentProvides = instance.parent && instance.parent.provides

  if (parentProvides === provides) {
    provides = instance.provides = Object.create(parentProvides)
  }

  provides[key as string] = value
}
```

最关键的是：

```ts
Object.create(parentProvides)
```

它创建一个新对象，并让这个新对象的原型指向父组件的 `provides`：

```txt
当前组件.provides
  [[Prototype]] -> 父组件.provides
    [[Prototype]] -> 祖父组件.provides
      [[Prototype]] -> appContext.provides
```

所以当前组件调用 `provide` 时，并不会污染父组件的 `provides`。它只是创建一个属于自己的 `provides` 对象，同时这个对象仍然可以通过原型链访问父级提供的数据。

## 5. 为什么子组件默认复用父组件的 provides？

组件创建时，子组件默认是：

```ts
child.provides = parent.provides
```

如果子组件没有调用 `provide`，它没有必要创建自己的 `provides` 对象。只有当子组件第一次调用 `provide` 时，才执行：

```ts
child.provides = Object.create(parent.provides)
```

这是一种懒创建策略：

- 不 `provide`：子组件直接复用父组件 `provides`
- 第一次 `provide`：子组件创建自己的 `provides`，并继承父组件 `provides`

这个设计有两个好处：

- 没有 `provide` 的组件不会额外创建对象
- `inject` 时可以通过原型链找到上层提供的数据

## 6. inject 是如何实现的？

`inject` 的核心逻辑可以简化成这样：

```ts
function inject(key: string | symbol, defaultValue?: unknown) {
  const instance = currentInstance
  const provides = instance.parent
    ? instance.parent.provides
    : instance.vnode.appContext.provides

  if (key in provides) {
    return provides[key as string]
  }

  return defaultValue
}
```

最关键的是：

```ts
key in provides
```

注意，它不是：

```ts
Object.prototype.hasOwnProperty.call(provides, key)
```

而是 `in` 操作符。`in` 会沿着原型链查找，所以 Vue 不需要手动递归父组件链。

它不是这样找的：

```ts
let parent = instance.parent
while (parent) {
  if (parent.provides[key]) return parent.provides[key]
  parent = parent.parent
}
```

Vue 3 的做法是：

```ts
const provides = instance.parent.provides
if (key in provides) {
  return provides[key]
}
```

因为 `provides` 自己已经通过原型链串起来了。

## 7. 最近的 provider 会覆盖更上层的 provider

假设有这样的组件结构：

```txt
App provide('theme', 'light')
└─ Page provide('theme', 'dark')
   └─ Button inject('theme')
```

`Button` 拿到的是：

```ts
'dark'
```

原因是：

```txt
Button 从 Page.provides 开始查找 theme
  ↓
Page.provides 自己就有 theme
  ↓
直接返回 dark
  ↓
不会继续向上找 App.provides.theme
```

这就是就近原则。如果多个祖先组件提供了相同的 key，后代组件会拿到离自己最近的那个。

## 8. provide / inject 和响应式的关系

一个容易误解的点是：==provide / inject 本身不制造响应式。==

它只是提供和读取一个值。这个值是否响应式，取决于被提供的值本身是不是响应式。

### 8.1 提供普通值

```ts
let count = 0
provide('count', count)
count++
```

后代组件：

```ts
const count = inject('count')
```

这种情况下，后代拿到的是当时的普通值，后续的 `count++` 不会让后代自动更新。

### 8.2 提供 ref

```ts
const count = ref(0)
provide('count', count)
```

后代组件：

```ts
const count = inject('count')
```

这里拿到的是 `ref` 本身，使用时需要：

```ts
count.value
```

官方文档明确说明：如果提供的是 `ref`，注入后会保持原样，不会自动解包，这样可以保留响应式连接。

### 8.3 提供 reactive 对象

```ts
const formState = reactive({
  name: '',
  age: 18,
})

provide('formState', formState)
```

后代组件：

```ts
const formState = inject('formState')
formState.name = 'Tom'
```

此时后代拿到的是同一个 reactive proxy，所以访问和修改它仍然具备响应式能力。

### 8.4 更推荐提供只读状态和修改函数

在可维护性更高的组件库或业务上下文里，推荐把状态修改收敛在 provider：

```ts
const location = ref('North Pole')

function updateLocation(next: string) {
  location.value = next
}

provide('locationContext', {
  location: readonly(location),
  updateLocation,
})
```

这样 injector 可以读状态，也可以通过明确的动作修改状态，但不会随意写 provider 的内部状态。

## 9. app.provide 是什么？

Vue 还支持应用级别的 provide：

```ts
const app = createApp(App)
app.provide('config', config)
```

这种方式适合插件、全局服务、全局配置，例如：

```ts
app.provide(routerKey, router)
app.provide(storeKey, store)
app.provide(i18nKey, i18n)
```

应用级 provide 会存到：

```ts
appContext.provides
```

然后根组件的 `provides` 会基于 `appContext.provides` 创建，所以组件内部的 `inject` 也可以拿到 `app.provide()` 提供的数据。

## 10. 为什么 provide / inject 要在 setup 里同步调用？

因为它们依赖当前组件实例：

```ts
currentInstance
```

在 `setup()` 执行期间，Vue 会把当前正在初始化的组件实例设置为 `currentInstance`。

大致流程是：

```txt
进入 setup
  ↓
设置 currentInstance = 当前组件实例
  ↓
执行 setup 里的代码
  ↓
provide / inject 可以拿到当前组件实例
  ↓
setup 执行结束
  ↓
清空 currentInstance
```

所以 `provide / inject` 必须在 `setup()` 阶段同步调用。如果脱离 `setup()`，Vue 就不知道当前调用属于哪个组件实例。

官方 API 也明确要求：`provide()` 和 `inject()` 都必须在组件 `setup()` 阶段同步调用。

## 11. 一个简化版实现

下面是一个极简版实现，用来理解核心原理：

```ts
let currentInstance: any = null

function createComponentInstance(parent: any) {
  return {
    parent,
    provides: parent
      ? parent.provides
      : Object.create(null),
  }
}

function provide(key: string | symbol, value: any) {
  const instance = currentInstance
  if (!instance) return

  let provides = instance.provides
  const parentProvides = instance.parent && instance.parent.provides

  if (provides === parentProvides) {
    provides = instance.provides = Object.create(parentProvides)
  }

  provides[key as string] = value
}

function inject(key: string | symbol, defaultValue?: any) {
  const instance = currentInstance
  if (!instance) return defaultValue

  const provides = instance.parent
    ? instance.parent.provides
    : Object.create(null)

  if (key in provides) {
    return provides[key as string]
  }

  return defaultValue
}
```

最关键的两句是：

```ts
instance.provides = Object.create(parentProvides)
```

和：

```ts
key in provides
```

前者负责建立原型链，后者负责通过原型链查找数据。

## 12. provide / inject 和 props / emits / Pinia 的区别

| 方案 | 适合场景 | 特点 |
|---|---|---|
| props | 父传子，层级较浅 | 显式、清晰、数据流容易追踪 |
| emits | 子组件通知父组件 | 事件向上流动 |
| provide / inject | 祖先给深层后代提供上下文 | 避免 props drilling，但依赖关系较隐式 |
| Pinia | 跨页面、跨模块、复杂业务状态 | 更适合全局状态管理 |

`provide / inject` 不应该替代所有 `props`。它适合：

- 主题配置
- 表单上下文
- 国际化配置
- 组件库内部上下文
- 插件注入服务
- 父级容器给深层子组件提供能力

不太适合：

- 普通父子通信
- 大量业务状态管理
- 需要清晰追踪数据流的复杂业务逻辑

## 13. 常见使用场景

### 13.1 表单组件

```txt
Form
├─ FormItem
│  └─ Input
└─ FormItem
   └─ Select
```

`Form` 可以通过 `provide` 提供表单上下文：

```ts
provide('formContext', {
  model,
  rules,
  validate,
})
```

深层的 `FormItem`、`Input`、`Select` 可以通过 `inject` 拿到上下文。

### 13.2 主题系统

```ts
provide('theme', {
  color: 'blue',
  size: 'medium',
})
```

后代组件：

```ts
const theme = inject('theme')
```

这样深层组件不用一层层传 `theme`。

### 13.3 组件库内部状态共享

```txt
Tabs
├─ TabPane
├─ TabPane
└─ TabPane
```

`Tabs` 提供当前激活项、切换方法等上下文：

```ts
provide('tabsContext', {
  activeKey,
  setActiveKey,
})
```

`TabPane` 注入：

```ts
const tabsContext = inject('tabsContext')
```

这样 `TabPane` 不需要显式接收一堆 `props`。

## 14. 真实客户问题怎么定位？

### 问题一：深层组件 inject 出来是 undefined

排查路径：

1. 确认 `provide` 是否在当前组件树的祖先组件里执行，而不是兄弟组件或另一个 app 实例里。
2. 确认 `provide` 和 `inject` 的 key 完全一致，复杂项目里优先用 `Symbol` 或 `InjectionKey`。
3. 确认调用发生在 `setup()` 同步阶段，异步回调里直接调用 `inject()` 会失去组件上下文。
4. 如果是插件提供能力，确认 `app.provide()` 在 `mount()` 前完成。

### 问题二：注入的值变了但页面不更新

排查路径：

1. 看 provider 提供的是普通值、`ref`、`reactive` 还是 `computed`。
2. 如果提供的是普通值，后续重新赋值不会让 injector 响应式更新。
3. 如果提供的是 `ref`，injector 拿到的是 `ref` 本身，模板里会解包，脚本里要用 `.value`。
4. 如果希望 Options API 的 `provide()` 跟随 `data` 更新，需要提供 `computed(() => this.xxx)`。

### 问题三：多个 provider 同名，拿到的不是预期值

排查路径：

1. 画出组件父链，而不是只看文件目录。
2. 找出离 injector 最近的同名 key provider。
3. 检查中间组件是否为了局部覆盖调用了同名 `provide`。
4. 对组件库上下文使用清晰命名或 Symbol，避免业务层误覆盖。

## 15. 大厂面试追问

- 为什么 Vue 3 用原型链而不是每次 inject 都 while 遍历父链？
- 为什么子组件默认复用父组件 `provides`，而不是创建新对象？
- `key in provides` 和 `hasOwnProperty` 在这里有什么差异？
- 为什么 `provide / inject` 本身不等于状态管理？
- 注入 `ref` 为什么不自动解包？这对响应式连接有什么意义？
- `app.provide()` 和组件内 `provide()` 的查找关系是什么？
- 组件库里设计 `Form`、`Tabs`、`Table` 上下文时，哪些能力适合 provide，哪些仍然应该走 props？

## 16. 面试版回答

Vue 3 的 `provide / inject` 是一种依赖注入机制，用来解决深层组件传值时的 `props drilling` 问题。

它的核心实现是：每个组件实例上都有一个 `provides` 对象，子组件默认复用父组件的 `provides`。当组件第一次调用 `provide` 时，Vue 会通过 `Object.create(parentProvides)` 创建一个以父级 `provides` 为原型的新对象，然后把 `key/value` 存到当前组件自己的 `provides` 上。

`inject` 时，Vue 并不是手动递归父组件链，而是从父组件的 `provides` 开始，用 `key in provides` 触发 JavaScript 原型链查找，从而找到最近的 provider。

另外，`provide / inject` 本身不制造响应式。只有提供的值本身是 `ref`、`reactive` 或 `computed` 时，注入方拿到后才会保持响应式连接。

## 17. 作业

1. 实现一个最小 `Form / FormItem / Input`，`Form` 通过 `provide` 暴露 `model`、`rules`、`validateField`，`Input` 不接收表单相关 props，只通过 `inject` 参与校验。
2. 写一个 `createInjectionKey<T>()` 示例，用 TypeScript 约束 `provide` 和 `inject` 的值类型。
3. 做一个对照实验：分别提供普通值、`ref`、`reactive`、`computed`，记录 injector 是否会响应式更新。
4. 画出一个三层 provider 同名覆盖的组件树，解释为什么后代拿到最近 provider。
5. 阅读 Vue core 的 `apiInject.ts`，把 `provide()` 和 `inject()` 的关键路径用 10 行以内伪代码复述出来。

## 18. 推荐阅读

- [Vue 官方文档：Provide / Inject](https://vuejs.org/guide/components/provide-inject.html)
- [Vue 官方 API：provide / inject](https://vuejs.org/api/composition-api-dependency-injection.html)
- [Vue core 源码：apiInject.ts](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiInject.ts)
- [Vue core 源码：component.ts](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/component.ts)
- [Vue core 源码：apiCreateApp.ts](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiCreateApp.ts)

## 19. 一句话总结

Vue 3 的 `provide / inject` 本质是基于组件实例 `provides` 对象和 JavaScript 原型链实现的依赖注入机制，用来解决深层组件传值问题。

## 📝 面试题自测

### Q1 [single]
Vue 3 的 `provide / inject` 主要解决什么问题？
A. 子组件向父组件派发 DOM 事件
B. 深层组件依赖一层层 props 中转的问题
C. 组件样式隔离问题
D. 服务端渲染 hydration 问题
答案：B
解析：provide / inject 的典型场景是解决 props drilling，让祖先组件向任意深度的后代提供上下文。

### Q2 [single]
组件实例创建时，子组件默认的 `provides` 通常是什么？
A. 永远是一个新的空对象
B. 父组件的 `provides`
C. 当前组件的 `props`
D. 当前 app 的 `config.globalProperties`
答案：B
解析：子组件默认复用父组件的 provides，只有第一次调用 provide 时才创建自己的 provides。

### Q3 [single]
某组件第一次调用 `provide` 时，Vue 为什么要执行 `Object.create(parentProvides)`？
A. 为了深拷贝父组件提供的所有值
B. 为了创建自己的 provides，同时通过原型链继承父级 provides
C. 为了把父组件 provides 清空
D. 为了让所有 inject 都变成异步
答案：B
解析：Object.create(parentProvides) 让当前组件拥有自己的 provides，又能通过原型链继续访问父级提供的数据。

### Q4 [judgment]
Vue 3 的 `inject` 必须手动 while 遍历父组件链，才能找到祖先 provider。
答案：错
解析：provides 对象已经通过原型链串起来，inject 通过 `key in provides` 即可触发原型链查找。

### Q5 [single]
`inject` 查找时使用 `key in provides` 而不是 `hasOwnProperty` 的关键原因是？
A. `in` 可以沿原型链查找
B. `in` 会自动创建默认值
C. `in` 可以让普通值变成 ref
D. `hasOwnProperty` 不能判断字符串 key
答案：A
解析：provide / inject 的核心查找依赖原型链，`in` 会检查对象自身和原型链上的属性。

### Q6 [single]
如果 `App` 和 `Page` 都 `provide('theme')`，`Page` 的深层后代 `inject('theme')` 会拿到哪个值？
A. App 提供的值
B. Page 提供的值
C. 两个值组成的数组
D. undefined
答案：B
解析：同名 provider 遵循就近原则，最近的 provider 会覆盖更上层的 provider。

### Q7 [judgment]
`provide / inject` 本身会把普通值包装成响应式数据。
答案：错
解析：provide / inject 只是传值机制，是否响应式取决于提供的值本身是不是 ref、reactive、computed 等响应式对象。

### Q8 [single]
如果 provider 提供的是 `ref(0)`，injector 在 `setup()` 里拿到的是什么？
A. 自动解包后的 number
B. ref 对象本身
C. 只读字符串
D. 一个 Promise
答案：B
解析：官方文档说明 ref 会按原样注入，不会自动解包，这样可以保留响应式连接。

### Q9 [multiple]
下面哪些场景适合使用 `provide / inject`？
A. 表单组件向 FormItem / Input 提供表单上下文
B. Tabs 向 TabPane 提供 activeKey 和切换方法
C. 普通父子组件传一个按钮文案
D. 插件提供全局服务或配置
答案：ABD
解析：provide / inject 适合上下文、组件库内部协作和插件能力注入；普通父子传值用 props 更清晰。

### Q10 [single]
`app.provide()` 提供的数据最终主要存在哪里？
A. appContext.provides
B. window.__VUE_PROVIDES__
C. 每个组件的 props
D. Pinia store
答案：A
解析：app.provide 会写入应用上下文的 provides，根组件和后代组件的 inject 可以从这里查到应用级依赖。

### Q11 [judgment]
`provide()` 和 `inject()` 都依赖当前组件实例，因此应在 `setup()` 阶段同步调用。
答案：对
解析：二者依赖 currentInstance；setup 执行期间 Vue 才能确定当前调用属于哪个组件实例。

### Q12 [multiple]
排查深层组件 `inject()` 得到 `undefined` 时，应该优先检查哪些点？
A. provider 是否位于当前组件父链上
B. provide / inject 的 key 是否一致
C. 是否在 setup 同步阶段调用
D. CSS scoped 是否开启
答案：ABC
解析：inject undefined 通常与父链、key、调用时机或 app.provide 注册时机有关，和 scoped CSS 无关。
