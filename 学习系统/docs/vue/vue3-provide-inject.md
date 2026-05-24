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

| 方案 | 适合场景 | 特点 |
|---|---|---|
| props | 父传子，层级较浅 | 显式、清晰、数据流容易追踪 |
| emits | 子组件通知父组件 | 事件向上流动 |
| provide / inject | 祖先给深层后代提供上下文 | 避免 props drilling |

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

---

## 📝 面试题自测

### Q1 [single]
Vue 3 的 `provide / inject` 主要解决什么问题？
A. 子组件向父组件派发 DOM 事件
B. 深层组件依赖一层层 props 中转的问题
C. 组件样式隔离问题
D. 服务端渲染 hydration 问题
答案：B
解析：
💡 它解决了什么问题：
如果不引入 `provide / inject` 依赖注入机制，当组件树的层级极深且叶子节点需要依赖根节点的全局配置、主题或表单状态时，就必须通过每一层中间组件显式传递 props（即 Prop Drilling）。这会导致中间组件的代码冗余，对无关 props 的修改极易引发不相关的组件重绘，且当系统重构、删除或增加中间层时，props 维护成本呈指数级上升。

🔍 核心原理解析（防拷打）：
1. 依赖注入（DI）机制将数据的供给者（Provider）和消费者（Consumer）完全解耦。消费者不需要关心数据经历了多少层物理组件才传递到它这里，只需要声称它需要某 key 即可。
2. 设计取舍：相较于将所有上下文都存储到外部全局状态管理（如 Pinia）的暴利方案，`provide / inject` 可以被局限在以某一组件为根的任意子树中。这允许在同一个页面中实例化多组完全隔离的上下文（例如多个独立的 Form 表单或 Tab 列表），这是单例 store 很难直接且干净地做到的。
3. 进一步拓展大厂面试追问：在组件库内部协作时，它还能极大地精简模板结构。例如组件库使用者只需要编写 `<Form><FormItem><Input /></FormItem></Form>`，无需在 `FormItem` 和 `Input` 上重复绑定表单模型或校验规则，从而由 `Form` 祖先同步注入给后代组件。

### Q2 [single]
在 Vue 3 组件实例创建时，子组件默认的 `provides` 通常是什么？
A. 永远是一个新的空对象
B. 父组件的 `provides`
C. 当前组件的 `props`
D. 当前 app 的 `config.globalProperties`
答案：B
解析：
💡 它解决了什么问题：
如果不采用子组件默认复用父组件 `provides` 的策略，而是在组件创建的第一时间就为每个组件都分配一个新的独立 `provides` 容器（并把父级的数据拷贝过来），那么当页面上存在上千个甚至上万个组件时，会产生严重的内存垃圾和不必要的对象开销。同时，上层 provider 的数据变化也无法实时透过共享引用向下传递。

🔍 核心原理解析（防拷打）：
1. 在初始化组件实例的 `createComponentInstance` 阶段，子组件的 `provides` 指针会直接指向父组件的 `provides` 引用：`provides: parent ? parent.provides : Object.create(appContext.provides)`。
2. 设计取舍：这是一种极为高效的“惰性共享引用（Lazy Sharing）”设计。在子组件没有调用 `provide` 自建命名空间前，整条树上所有未提供新数据的组件都共享父组件的 `provides` 对象，实现了内存占用的最小化。
3. 进一步拓展大厂面试追问：如果在父组件 `provide` 了一个新值后，子组件再通过 `provide` 提供另一个值，子组件的 `provides` 会变化吗？是的，此时子组件由于“写时复制（Copy-on-write）”机制，会重新创建属于自己的 `provides` 独立对象，并将原型链指向上层，从而实现了“子修改不污染父，但子能访问父”的隔离与共享效果。

### Q3 [single]
在 Vue 3 中，某组件第一次调用 `provide` 时，Vue 为什么要执行 `Object.create(parentProvides)`？
A. 为了深拷贝父组件提供的所有值
B. 为了创建自己的 provides，同时通过原型链继承父级 provides
C. 为了强行切断与祖先组件原型链的关联以防范样式污染
D. 强制将 provides 实例注册为只读 Proxy 以提升响应式检索速度
答案：B
解析：
💡 它解决了什么问题：
如果不通过原型链关联 `parentProvides`，而是直接将子组件的 `provides` 设为一个全新的独立对象，那么一旦子组件 `provide` 了任何数据，它就会彻底切断与上层祖先组件 `provides` 的联系。后代组件将无法再通过该子组件注入任何来自更上层祖先（如爷爷组件、App 级）的数据，从而破坏了依赖传递链。

🔍 核心原理解析（防拷打）：
1. 在首次调用 `provide` 时，Vue 检测到当前组件的 `provides` 与其父组件的 `provides` 引用相同。为了不直接污染父级，Vue 此时执行 `provides = instance.provides = Object.create(parentProvides)`。
2. 设计取舍：`Object.create` 创建了一个干净的空对象，但其内部的 `[[Prototype]]` 指向了父组件的 `parentProvides`。当对该对象写入新的键值对时，它们只会作为组件自身的普通属性（Own Properties）被保存，不会污染父组件的原型对象；而当读取属性时，JavaScript 引擎会沿原型链天然地向上回溯。
3. 进一步拓展大厂面试追问：如果组件连续调用两次 `provide`，会执行两次 `Object.create` 吗？不会，因为第一次执行后，`instance.provides` 与 `parentProvides` 的引用就已经不再相等，后续的 `provide` 调用会直接在这个已建立的原型对象上写值。

### Q4 [judgment]
在 Vue 3 的组件树中，`inject` 必须手动 while 遍历父组件链，才能找到祖先 provider。
答案：错
解析：
💡 它解决了什么问题：
如果在 `inject` 时必须在运行时通过 `while` 循环去逐级遍历 `instance.parent.parent...` 链条并一一检索键值，那么当组件层级非常深（例如在巨型动态表单或虚拟列表中，层级可能达到数十层）时，每次 `inject` 都会带来严重的遍历寻址开销，拉低运行时的求值性能。

🔍 核心原理解析（防拷打）：
1. Vue 3 巧妙地将组件层级树投射到了 JavaScript 的“对象原型链”上。通过 `provides = Object.create(parentProvides)`，所有的祖先 provides 节点已在内存中形成了一条隐式原型链。
2. 设计取舍：虽然原型链的建立需要消耗一次 `Object.create` 的微小分配成本，但换来的是后代组件在 `inject` 时，只需通过 `key in provides` 或是直接访问属性，就能在底层引擎层面直接回溯并返回，避开了频繁的 JavaScript 函数调用和 while 循环遍历。
3. 进一步拓展大厂面试追问：在 Vue 2 中是如何实现的？Vue 2 由于没有使用原型链，在 `inject` 阶段确实需要写一个 `while (current)` 循环来沿父组件链手动向上寻找 `provides` 容器。这也是 Vue 3 核心架构师对性能和内存做出的重大重构之一。

### Q5 [single]
在 Vue 3 中，`inject` 查找依赖时使用 `key in provides` 而不是 `hasOwnProperty` 的关键原因是？
A. `in` 可以沿原型链查找
B. `in` 会自动创建默认值
C. `in` 可以让普通值变成 ref
D. `hasOwnProperty` 不能判断字符串 key
答案：A
解析：
💡 它解决了什么问题：
如果不使用 `in` 操作符而使用 `hasOwnProperty`，`hasOwnProperty` 只会局限在直接父组件的 `provides` 对象自身属性上进行检索。一旦该值来自爷爷组件或根组件（即通过原型继承的上层属性），`hasOwnProperty` 将返回 `false`，从而导致 `inject` 无法跨越单层父组件获取更深层的数据。

🔍 核心原理解析（防拷打）：
1. `in` 操作符会检索对象自身及其隐式原型 `__proto__` 指向的所有上层原型链；而 `hasOwnProperty` 是专用于判断对象“自身拥有的非继承属性”的 API。
2. 设计取舍：在 `inject` 机制中，由于祖先组件的 `provides` 被串联在了隐式原型上，使用 `key in provides` 才能与 Vue 3 独创的原型链继承存储结构无缝配合。
3. 进一步拓展大厂面试追问：使用 `in` 操作符有什么潜在隐患吗？因为 `in` 也会把 `Object.prototype` 上的自带属性（如 `toString`、`valueOf`）判定为存在。因此，如果用户误将 `toString` 作为 inject 的 key，且没有传入默认值，将会错误地注入 Object 原生方法。在实际开发中，应尽量避免使用原生 Object 属性名作为 InjectionKey，最好使用 Symbol。

### Q6 [single]
在 Vue 3 中，如果根组件 `App` 和中间组件 `Page` 都通过 `provide('theme')` 提供了相同键名的值，那 `Page` 的深层后代通过 `inject('theme')` 最终会拿到哪个值？
A. App 提供的值
B. Page 提供的值
C. 两个值组成的数组
D. undefined
答案：B
解析：
💡 它解决了什么问题：
如果不遵循就近覆盖原则，而是粗暴地允许多个同名 provider 的值混合在一起或让最外层的值优先，那么在编写通用的复杂子系统（如局部多主题包覆、局部多语言覆盖）时，局部组件就无法通过再次 `provide` 同名 key 来临时局部改写配置，从而导致框架的上下文覆盖能力受限。

🔍 核心原理解析（防拷打）：
1. 当后代组件 `inject` 某 key 时，Vue 会从当前组件的直接父级的 `provides` 对象开始查找。
2. 因为原型链的遮蔽效应（Property Shadowing）：如果原型链上较近的节点（例如子对象的 Own Properties）中已经定义了该属性，JavaScript 引擎在读取时会直接将其返回，阻止继续向上寻址到更远的原型（父对象的属性）。
3. 进一步拓展大厂面试追问：如果后代组件需要“绕过”最近的 `Page` provider，强行去读取 `App` 提供的值，这在 Vue 的官方 API 中支持吗？官方不支持，因为原型链遮蔽是单向的且无法透传。但如果确实需要该能力，必须在顶层 `App` provide 时使用一个特异化的 Key（例如 `globalThemeKey`），并在注入端显式声明。

### Q7 [judgment]
在 Vue 3 中，`provide / inject` 本身会自动把普通值包装成响应式数据。
答案：错
解析：
💡 它解决了什么问题：
如果 `provide` 自动将所有普通值包装为响应式对象（例如隐式转化为 `ref`），不仅会造成额外的内存分配负担，还会因为隐式的解包/包装行为，导致数据流在传输时失去显式掌控，让原本不需要响应式的静态配置或工具函数强行被追踪，损耗响应式追踪性能。

🔍 核心原理解析（防拷打）：
1. `provide` 只是单纯的对象属性写操作，`inject` 也只是单纯的读操作。它们不具备任何类似 `ref` 或 `reactive` 收集依赖（track）和派发更新（trigger）的包裹拦截逻辑。
2. 设计取舍：Vue 提倡“关注点分离”，让响应式（Reactivity System）与上下文传参（Dependency Injection）作为两套完全独立的引擎运行。如果需要数据在跨组件传输时保持同步更新，开发者应当主动传递一个由响应式系统包装好的对象（如 `ref(xxx)`、`reactive(obj)`）。
3. 进一步拓展大厂面试追问：在注入端，如果通过 `inject` 拿到了一个 `ref` 或者是 `computed`，在 Composition API 中我们需要通过 `.value` 来访问和操作它。但在 Options API 的 `inject` 选项中，Vue 内部是否会自动为我们做解包呢？在 Options API 的 runtime 处理阶段，Vue 会对注入项进行拦截，若检测到是 Ref 对象，会在将其挂载到组件代理对象 `ctx` 上时自动进行解包代理，让 Options 语法中能够像普通 data 一样通过 `this.xxx` 访问。

### Q8 [single]
在 Vue 3 中，如果祖先组件通过 `provide` 提供的是一个 `ref(0)`，那么后代组件在 `setup()` 里通过 `inject` 拿到的是什么？
A. 自动解包后的 number
B. ref 对象本身
C. 只读字符串
D. 一个 Promise
答案：B
解析：
💡 它解决了什么问题：
如果在依赖注入传输的过程中，Ref 对象被隐式、自动解包为底层的值（例如 number `0`），那么后代组件将彻底丢失与祖先组件响应式状态的引用连接。当祖先的 `ref` 值在后续发生变更时，后代组件拿到的仅仅是当时的静态基础数值，无法感知更新并触发自身的重绘，这会让响应式网络在跨层级传输时断裂。

🔍 核心原理解析（防拷打）：
1. 依赖注入只在传递时拷贝属性引用的地址。因为 `Ref` 对象本身是一个引用类型（`RefImpl`），它在 `provides` 对象中是以原始对象地址保存的，在 `inject` 获取时仅仅是返回了相同的内存指针，因此不会发生解包。
2. 设计取舍：在 `setup` 期间保持 Ref 不解包，使得后代组件可以显式通过 `.value` 或在模板中进行依赖追踪；而在组件库设计中，也能方便后代直接将此 `ref` 作为计算属性或其它 `watch` 的监听源。
3. 进一步拓展大厂面试追问：如果后代组件修改了这个注入的 `ref.value`，祖先组件的值会变吗？会变，因为它们共享同一个 Ref 对象的引用。为了遵循“单向数据流”原则，避免后代组件隐式修改祖先状态导致 Bug 难排查，推荐在 `provide` 时提供 `readonly(ref)`，或者单独暴露一个专用的 `update` 修改函数。

### Q9 [multiple]
在 Vue 3 开发中，下面哪些场景适合使用 `provide / inject` 进行依赖注入？
A. 表单组件向 FormItem / Input 提供表单上下文
B. Tabs 向 TabPane 提供 activeKey 和切换方法
C. 普通父子组件传一个按钮文案
D. 插件提供全局服务或配置
答案：ABD
解析：
💡 它解决了什么问题：
如果将所有的普通父子传值或极其明确的单层父子通信都改用 `provide / inject`，会导致代码失去显式的 props 数据流向。对于维护者来说，查看子组件模板时很难一眼看出数据的来源和变更时机，导致系统的“隐式耦合”度大幅升高，增加维护难度。

🔍 核心原理解析（防拷打）：
1. 适用于“隐式上下文共享（Implicit Context Sharing）”场景。当子组件的结构和数量是动态的、嵌套的，且这些子组件天然作为父级容器的逻辑分支时（如 `FormItem` 必须要知道 `Form` 实例），Props 变得极难扩展，此时 DI 是唯一的解。
2. 设计取舍：Vue 的组件通信手段多样化：Props/Emits 保证了强类型、显式的组件契约；Pinia 解决了跨路由、无逻辑树关联的纯业务状态共享；而 `provide / inject` 则专为“具有逻辑树层级关系、需要上下文深度传递”的架构组件所设计。
3. 进一步拓展大厂面试追问：对于第三方库（如 Vue Router 里的 `useRouter()`），它们在底层是如何获取路由实例的？它们正是通过在全局 `app.provide` 注册路由单例，并在 Composition API 暴露的 `useRouter` 辅助函数中同步调用 `inject(routerKey)` 来获取的。

### Q10 [single]
在 Vue 3 中，通过全局应用实例 `app.provide()` 提供的数据最终主要存在哪里？
A. appContext.provides
B. window.__VUE_PROVIDES__
C. 每个组件的 props
D. Pinia store
答案：A
解析:
💡 它解决了什么问题：
如果不设计一个应用级的应用上下文 `appContext.provides`，而是让每个 app 实例的全局 provide 都在每个组件创建时强行塞入组件实例中，不仅会导致根组件创建前的 provides 分配无序，还会让多个并存的 app 实例（例如在微前端或 SSR 场景下）的全局注入发生命名空间冲突和内存泄露。

🔍 核心原理解析（防拷打）：
1. `app.provide(key, value)` 会直接写在应用实例的 `appContext.provides[key] = value` 上。
2. 当渲染根组件（Root Component）并调用 `createComponentInstance` 时，它的 `provides` 指针是基于 `Object.create(appContext.provides)` 来初始化的。这让所有的组件在溯源原型链时，都能在最顶层寻址到应用上下文提供的全局依赖。
3. 进一步拓展大厂面试追问：如果中间某个组件调用了 `provide` 重写了全局 app 提供的某个 key，那么会影响到其它子树上 inject 相同 key 的组件吗？完全不会。因为中间组件的 `Object.create(parentProvides)` 为其自身的子树切分出了独立的隐式原型节点，重写只会遮蔽该组件以下的子树，其它无关联的兄弟子树在原型链向上回溯时，依然只能寻址到最顶端的 `appContext.provides`。

### Q11 [judgment]
在 Vue 3 中，`provide()` 和 `inject()` 都依赖当前组件实例，因此应在 `setup()` 阶段同步调用。
答案：对
解析：
💡 它解决了什么问题：
如果不在 `setup` 同步执行期间锚定当前组件实例，而是允许在异步回调（如 `setTimeout`、`await fetch`）之后调用 `provide` / `inject`，此时由于当前的 JavaScript 调用栈早已经退出了 setup 的生命周期，全局变量 `currentInstance` 已被重置为 `null`。Vue 将无法判定该调用发生在哪个组件实例内部，从而无法获取其 `provides` 或 `parent.provides`，引发运行时报错。

🔍 核心原理解析（防拷打）：
1. Vue 在运行 setup 时，会通过 `setCurrentInstance(instance)` 将实例暂时缓存到全局单例变量中。由于 JavaScript 是单线程的，setup 期间的同步代码可以通过该全局变量安全地拿到当前实例。而一旦 setup 执行完毕，Vue 必定同步调用 `setCurrentInstance(null)` 清空缓存。
2. 设计取舍：很多库为了保证异步可用，可能会尝试闭包持有实例。但 Vue 坚持不这么做，是因为闭包持久化组件实例会导致巨大的内存泄露隐患，且在并发渲染（如 SSR）时会导致严重的实例上下文错乱。
3. 进一步拓展大厂面试追问：如果我必须在异步请求后进行 `provide`，有什么绕过的方案吗？可以通过在 setup 的同步阶段先创建一个响应式对象并 `provide` 出去，随后在异步回调中去修改该响应式对象内部的属性。这样既遵守了同步调用的规范，又实现了异步数据的动态共享。

### Q12 [multiple]
在 Vue 3 开发中，排查深层组件 `inject()` 得到 `undefined` 时，应该优先检查哪些点？
A. provider 是否位于当前组件父链上
B. provide / inject 的 key 是否一致
C. 是否在 setup 同步阶段调用
D. CSS scoped 是否开启
答案：ABC
解析：
💡 它解决了什么问题：
如果在遇到 `inject()` 得到 `undefined` 时没有一套清晰的、基于底层原理的工程排查链路，开发者可能会在不相干的地方（如 scoped 样式、Props 传递、打包配置等）盲目尝试，极大增加定位和解决 Bug 的时间成本。

🔍 核心原理解析（防拷打）：
1. 注入依赖失败的底层根源只可能是：1) 原型链查找范围越界（Provider 不在父子链路树上）；2) 原型链属性 Key 匹配失败（如拼写错误或 Symbol 引用不同）；3) 调用时机错误导致 `currentInstance` 未被捕获。
2. 排查三部曲：第一步，验证物理依赖树。可以通过 Vue Devtools 检查目标 Consumer 组件的 `provides` 面板中是否存在上游继承的原型链，若无，证明祖先未挂载或非父子树关系。第二步，验证 Key 指针。在跨包或微前端中，直接字符串 key 拼写不符或两端独立引用的 Symbol 不相等会导致 `in` 查找失败。第三步，验证执行时机。必须确保在 setup 同步顶层中执行了获取。
3. 进一步拓展大厂面试追问：如果某些注入确实是可选的，为了防止返回 `undefined` 导致程序崩溃，`inject` 提供了什么防御性机制？`inject` 的第二个参数支持传入默认值（Default Value），如果未能在原型链上搜寻到 Key，会退回返回该默认值；同时还支持第三个参数 `treatDefaultAsFactory: boolean` 来确定是否将默认值作为工厂函数执行，从而动态创建复杂的默认对象。
