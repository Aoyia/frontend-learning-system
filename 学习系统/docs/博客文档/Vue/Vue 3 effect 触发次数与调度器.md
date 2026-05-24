---
title: Vue 3 effect 触发次数、RenderEffect 调度器与合并执行
module: vue
difficulty: 进阶
tags: [vue, effect, scheduler, reactivity, microtask, queueJob]
sourceType: blog
sourceTitle: Vue 3 effect 触发次数、RenderEffect 调度器与合并执行
sourceUrl: 
sourceAuthor: 
originalPath: 学习系统/日常工作学习过程中的看过的文档/vue3这个 effect 执行了多少次.md
order: 4
created: 2026-05-18
updated: 2026-05-18
---

# Vue 3：effect 触发次数、RenderEffect 调度器与合并执行

## 题目

```ts
const state = reactive({ a: 1, b: 2, c: 3 })

effect(() => {
  console.log(state.a + state.b + state.c)
})

// 问题 1：以下操作触发几次 effect？
state.a = 10
state.b = 20
state.c = 30

继续追问：
 1. RenderEffect 里面会有 scheduler 吗
 2. 如果想把上面的代码变成“合并为一次执行”，应该怎么写

⸻

结论速记

问题 1

这 3 次赋值会触发 3 次 effect。

如果把初始化时 effect() 的首次立即执行也算进去，那么总共执行 4 次。

执行过程：
 • 初始化：6
 • state.a = 10 -> 15
 • state.b = 20 -> 33
 • state.c = 30 -> 60

问题 2

RenderEffect 有 scheduler。

组件更新之所以常常表现为“合并执行”，核心不是“所有 effect 天生会合并”，而是：
 • 组件内部的 ReactiveEffect 挂了 scheduler
 • scheduler 会把更新任务放进队列
 • 队列会去重
 • 同一轮同步修改，最后通常只执行一次

问题 3

想让手写的裸 effect 合并执行，需要：
 • 手动传 scheduler
 • 自己做一个任务队列
 • 用微任务统一 flush
 • 队列里对同一个 job 去重

⸻

先把最容易混淆的点说清楚

很多人会混淆这两件事：

1. 裸 effect

effect(() => {
  console.log(state.a)
})

这是响应式层的副作用。

特点：
 • 默认同步执行
 • 依赖一变就重新跑
 • 默认没有组件那套调度队列

2. 组件 RenderEffect

这是运行时里的渲染副作用。

特点：
 • 本质上也是 ReactiveEffect
 • 但内部会挂 scheduler
 • 不是每次变更都立刻重新 render
 • 而是先进队列、去重、再统一执行

⸻

为什么上面的代码会触发 3 次

因为它是裸 effect，不是组件渲染 effect。

state.a = 10
state.b = 20
state.c = 30

这是 3 次独立的 set。

对于默认的裸 effect 来说，每次依赖变了都会重新执行，所以会触发 3 次，而不是 1 次。

⸻

运行过程

const state = reactive({ a: 1, b: 2, c: 3 })

effect(() => {
  console.log(state.a + state.b + state.c)
})

初始化会先执行一次：

6

然后：

state.a = 10 // 15
state.b = 20 // 33
state.c = 30 // 60

所以结论是：
 • 不算初始化：3 次
 • 算初始化：4 次

⸻

RenderEffect 为什么能合并

可以把组件更新流程粗暴记成：

依赖变化
-> 触发 scheduler
-> scheduler 把 job 放进队列
-> 队列去重
-> 本轮同步任务结束后统一执行

也就是它不是直接：

依赖变化 -> 立刻 render

而是：

依赖变化 -> 先排队 -> 最后统一执行


⸻

可以怎么理解组件内部结构

面试时不用背源码细节，但可以记住这个抽象：

const effect = new ReactiveEffect(componentUpdateFn)
const update = effect.run.bind(effect)
const job = effect.runIfDirty.bind(effect)

effect.scheduler = () => queueJob(job)

可以这样理解：
 • effect：真正的响应式副作用对象
 • update：直接执行更新
 • job：真正交给调度器排队的任务
 • scheduler：不直接 run，而是把 job 放进队列

⸻

如果想把裸 effect 改成合并执行，怎么写

核心思路：

不要依赖一变就直接执行，而是把执行动作塞进微任务队列，并对同一个任务去重。

示例

import { reactive, effect } from 'vue'

const state = reactive({ a: 1, b: 2, c: 3 })

const jobQueue = new Set<() => void>()
let isFlushing = false
const resolvedPromise = Promise.resolve()

function queueJob(job: () => void) {
  jobQueue.add(job)

  if (!isFlushing) {
    isFlushing = true
    resolvedPromise.then(() => {
      try {
        jobQueue.forEach(job => job())
      } finally {
        jobQueue.clear()
        isFlushing = false
      }
    })
  }
}

let runner!: () => void

runner = effect(
  () => {
    console.log(state.a + state.b + state.c)
  },
  {
    scheduler: () => {
      queueJob(runner)
    }
  }
)

state.a = 10
state.b = 20
state.c = 30


⸻

这段代码的结果

初始化先执行一次：

6

后面 3 次修改虽然都触发了 scheduler，但入队的是同一个 runner，而且队列是 Set，所以会去重。

最终只会额外执行一次：

60

也就是：
 • 初始化：1 次
 • 后续连续赋值：合并后 1 次

⸻

一句话理解这段改造

默认裸 effect 是：

依赖变了 -> 直接执行

传入 scheduler 后变成：

依赖变了
-> 不直接执行
-> 先交给 scheduler
-> scheduler 放进队列
-> 队列去重
-> 微任务里统一执行


⸻

一句话表达：

手写的裸 effect 默认没有调度器，所以连续三次赋值会触发三次。组件的 RenderEffect 不一样，它内部会挂 scheduler，更新不会立刻执行，而是进入调度队列并去重，所以通常表现为批量合并执行

---

## 作业

1. 分别运行裸 `effect` 和组件渲染更新案例，记录同步修改三次数据时的执行次数。
2. 实现一个微任务队列，用 Set 对 job 去重，让裸 effect 支持合并执行。
3. 解释组件 `RenderEffect` 的 scheduler 和普通响应式 effect 的默认行为差异。
4. 写出 `nextTick`、微任务 flush、组件更新队列三者之间的时序关系。

## 📝 面试题自测

### Q1 [single]
在 Vue 3 响应式系统中，对于没有自定义调度器（scheduler）的裸 effect，连续执行 'state.a = 10; state.b = 20; state.c = 30' 三次赋值会触发几次 effect 执行（不包含首次注册初始化）？
A. 1 次（合并执行）
B. 2 次
C. 3 次
D. 0 次（Vue 自动批处理）
答案：C
解析：
💡 它解决了什么问题：
如果不明确区分同步触发与异步合并，开发者会误以为裸 effect 天生支持性能批处理，导致在多次同步修改数据时，触发海量无意义的中间计算，甚至引发严重的卡顿或死循环。

🔍 核心原理解析（防拷打）：
1. 裸 effect 的 trigger 机制是同步的。当没有挂载自定义 scheduler 时，响应式数据的值一发生改变，对应的 track 依赖就会被立即遍历并同步执行 effect.run()。
2. 3次连续的同步赋值会直接同步触发3次 effect 运行，此时没有微任务去重的机制发挥作用。
3. 进一步拓展大厂面试追问：在裸 effect 中如果发生相互依赖的“循环赋值”，会导致什么后果？会瞬间触发 V8 的 Call Stack Size Exceeded（内存栈溢出）错误而 crash。此时必须引入 scheduler 异步调度或使用 ref/shallowRef 隔离依赖收集。

### Q2 [single]
在上题所描述的无调度器裸 effect 代码中，包含首次注册的初始化执行，总共会输出几次？
A. 3
B. 4
C. 6
D. 1
答案：B
解析：
💡 它解决了什么问题：
理清 effect 初始化执行（依赖收集阶段）与后续更新执行的区别，防止开发者误判首次渲染时的副作用发生时机。

🔍 核心原理解析（防拷打）：
1. 首次立即执行：裸 effect 注册时，底层会立即同步执行一次，其目的是运行函数内部的 getter 读取属性，完成 targetMap 的依赖收集（track）。
2. 后续更新：3 次赋值每次由于数据变更都会触发一次同步 trigger，加上初始化执行，总计 4 次。
3. 进一步拓展大厂面试追问：如何在 effect 注册时不让其立即执行，仅在依赖变化时才触发？可以在 ReactiveEffect 的配置项中传入 lazy: true，这样就能实现仅在后续 trigger 时更新。

### Q3 [judgment]
在 Vue 3 中，组件的渲染 effect（RenderEffect）与没有调度器的普通裸 effect 一样，其所依赖的响应式数据变化时都会立即同步执行更新。
答案：错
解析：
💡 它解决了什么问题：
解释了为什么 Vue 组件内部有成百上千个数据发生改变，但组件却不会同步频繁重绘导致白屏。它揭示了组件更新的性能保护锁机制。

🔍 核心原理解析（防拷打）：
1. 组件更新机制：在组件挂载时，系统会为其创建一个以 componentUpdateFn 为核心的 RenderEffect，并显式配置了自定义的 scheduler 调度器。
2. 调度执行时序：当组件依赖的状态数据变化时，trigger 会触发该 RenderEffect 的 scheduler。该 scheduler 不会同步执行更新，而是将当前组件的 update job push 进一个全局的异步队列（queueJob），并在微任务中统一 flush。
3. 进一步拓展大厂面试追问：如果组件更新在微任务中执行，那么在同步代码中直接读取 DOM 节点能拿到最新的数据吗？不能。此时必须使用 'nextTick(callback)'。其底层正是利用 Promise.resolve().then() 把 callback 挂载在异步组件更新队列 flush 之后的微任务节点，从而确保能安全拿到更新后的最新 DOM。

### Q4 [multiple]
关于 Vue3 组件更新合并的核心机制，以下哪些说法正确？
A. 组件 RenderEffect 有 scheduler，不直接执行而是把 job 放进队列
B. 队列使用 Set 或去重机制，同一个 job 多次入队只执行一次
C. 队列通过 Promise.then（微任务）统一 flush
D. 所有 effect 包括裸 effect 天生都会合并执行
答案：ABC
解析：
💡 它解决了什么问题：
解决了在同一轮同步代码中，高频重复修改组件数据或多个子组件频繁通知父组件更新时，防止重复执行 render 函数带来的 CPU 算力灾难。

🔍 核心原理解析（防拷打）：
1. 去重队列：scheduler 会把组件更新的 job 塞入一个内部的队列。由于队列底层使用 Set 或者是进行去重判定，即使在同一轮同步任务中对组件状态赋值了 100 次，该组件的 update job 也只会被入队一次。
2. 微任务清空：在当前同步宏任务执行完毕后，微任务队列中唯一的 flush 任务启动，将去重后的队列依次执行完毕。
3. 进一步拓展大厂面试追问：如果有父子组件嵌套，在 flush 队列时，如何保证父组件的更新永远先于子组件执行？Vue 会在 flush 前，对队列中的 jobs 按照组件的 uid 进行单调递增排序。这样能保证：一 父组件先更新，如果父组件在更新中销毁了子组件，子组件的 update 即可直接从队列中跳过；二 父组件更新传入子组件的新 Props，可以与子组件自身的更新合并，避免重复渲染。

### Q5 [single]
在 Vue 3 中，若想让一个裸 effect 实现类似组件渲染那样的多次赋值合并为一次执行（批处理），在创建 ReactiveEffect 时核心需要传入什么参数？
A. lazy: true
B. scheduler 函数，配合任务队列 and 微任务 flush
C. deep: true
D. flush: 'post'
答案：B
解析：
💡 它解决了什么问题：
解决了原生 ReactiveEffect 无法自主控制执行时机、无法实现业务级异步去重的限制，为高频数据流计算提供节流防线。

🔍 核心原理解析（防拷打）：
1. 自定义调度器：创建 ReactiveEffect 时传入的 scheduler 函数。一旦配置了该参数，trigger 阶段将不再直接运行 effect.run()，而是转而调用 scheduler。
2. 异步清空设计：开发者需要在 scheduler 内部手写 queueJob(effect.run)，在内存中维护一个 Set 队列，并在微任务（Promise.then）中统一运行，实现裸 effect 批处理。
3. 进一步拓展大厂面试追问：Vue 中的 computed 属性其实也是一个 effect，它是如何利用 scheduler 机制进行懒计算的？computed 的 ReactiveEffect 的 scheduler 只会将缓存脏状态 dirty 设为 true，并触发依赖它的上层 effect 更新，它本身绝对不会在 scheduler 中立即重新执行计算，只有当上层真正读取 computed.value 且发现 dirty 为 true 时，才会同步执行求值，达成了极致的懒加载优化。

### Q6 [single]
在 queueJob 的手写实现中，队列使用 'Set' 而不是 'Array' 的原因是？
A. Set 的 forEach 更快
B. Set 自动对相同引用的 job 去重，确保同一轮同步中同一个 job 只执行一次
C. Array 的 indexOf 在多任务高频检索时的 O(n) 开销会阻塞微任务执行
D. Set 可以在底层利用 C++ 级别的硬件缓存优化迭代性能
答案：B
解析：
💡 它解决了什么问题：
避免了在队列中累积大量指向同一个组件或同一个计算副作用的重复执行任务，防止产生严重的冗余渲染和死循环。

🔍 核心原理解析（防拷打）：
1. 唯一性约束：组件更新任务的核心是执行 componentUpdateFn。在同一轮同步事件中，无论组件状态变化了多少次，其 VNode 更新的逻辑完全是一致的。
2. Set 数据结构具有天然的元素唯一性。使用 Set 存储任务引用，多次 push 相同函数只会保留一个物理实体，实现了 O(1) 复杂度的极速去重。
3. 进一步拓展大厂面试追问：在 K8s 容器编排或大规模微前端应用中，如果两个独立的 Vue 应用共享了同一个全局 scheduler，会发生什么？可能会导致事件触发时，两个应用的微任务队列发生交叉干扰。因此，每个 Vue Application 实例都必须拥有自己独立的、闭包隔离的 queue 队列与 flush 周期，确保沙箱安全性。

### Q7 [judgment]
'Promise.resolve().then(flush)' 实现的是宏任务（macro task）批处理。
答案：错
解析：
💡 它解决了什么问题：
纠正了对浏览器“事件循环”微任务与宏任务的时序误判，防止团队将更新时机误设为 setTimeout 宏任务，导致发生静态样式闪烁。

🔍 核心原理解析（防拷打）：
1. 微任务时序：Promise.resolve().then() 属于微任务（Microtask）。
2. 在当前同步 JS 栈空闲后，浏览器在执行下一次渲染重绘之前，会一次性将所有的微任务队列彻底清空。这保证了组件的数据合并更新在视觉呈现前就已经全部完成，用户看不到任何中间态的画面闪烁。
3. 进一步拓展大厂面试追问：如果在一轮同步任务中，我们往微任务队列里无限 push 任务（如在 Promise 中递归 resolve），会导致什么现象？会使得浏览器主线程完全卡死，页面无法渲染重绘，用户无法进行任何点击操作，最终导致浏览器标签页 Crash。

### Q8 [multiple]
以下关于 Vue3 组件内部 effect 结构的描述，哪些正确？
A. 'instance.effect' 是一个 ReactiveEffect 实例
B. effect.scheduler 被赋值为 '() => queueJob(job)'，而非直接执行更新
C. job 是 'effect.runIfDirty' 的绑定函数，只在 dirty 时才真正执行
D. 每次数据变化组件都会立即同步重新 render
答案：ABC
解析：
💡 它解决了什么问题：
理清了 Reactivity 模块与 Component 运行时模块之间的物理连接纽带，为排查组件不触发更新、依赖丢失等深水区 Bug 提供排查地图。

🔍 核心原理解析（防拷打）：
1. 实例连接：组件实例的 instance.effect 是一个真正的 ReactiveEffect 实例。
2. 调度绑定：它的 scheduler 函数被设置为 () => queueJob(job)。其中 job 就是包装了更新渲染函数的组件实例任务。一旦数据触发 trigger，就会调用该 scheduler 从而进入批处理逻辑。
3. 进一步拓展大厂面试追问：在组件 unmount 时，为了防止发生内存泄漏，这个 instance.effect 是如何被清理的？在 unmountComponent 流程中，Vue 会同步调用 effect.stop()。它会遍历该 effect 的所有 deps 依赖数组，将自身从所有响应式属性的 targetMap 订阅者列表中彻底移除，切断了废弃实例的闭包引用。

### Q9 [single]
手写调度器实现中，'isFlushing' 标志位的作用是？
A. 标记当前是否处于 effect 收集依赖阶段
B. 防止在 flush 期间重复创建多个 Promise.then 回调，保证只有一个微任务在等待执行
C. 标记 effect 是否已被销毁
D. 控制 effect 的执行优先级
答案：B
解析：
💡 它解决了什么问题：
解决了异步调度系统中由于高频触发入队操作，导致并发开启多个微任务 Promise 异步回调执行、使整个清空队列逻辑发生错乱和重复清空的致命时序隐患。

🔍 核心原理解析（防拷打）：
1. 锁控制机制：isFlushing 是一个典型的“看门狗锁（Mutex）”。
2. 当第一个任务入队并准备在微任务中执行 flush 时，将 isFlushing 设为 true。此后在这一轮同步事务内，后续所有任务的入队动作，只要判断 isFlushing 已经是 true，就不会去重复调用 Promise.resolve().then(flush)，从而保障了全局只有一个微任务在排队清空。
3. 进一步拓展大厂面试追问：在 flush 执行期间，如果有新的 job 在运行中被动态插入了队列（即在 flush 过程中触发了另一个组件的更新），isFlushing 应该如何表现？Vue 采用的解决手段是：在 flush 内部，循环执行 jobs 队列时，允许队列在执行过程中动态扩容，但会维持 isFlushing 为 true，直到队列中所有动态新增的 job 全部被清空完毕，才将 isFlushing 重置为 false，这确保了“一轮微任务彻底搞定所有关联更新”。

### Q10 [judgment]
在 Vue 3 响应式系统中，即便为 ReactiveEffect 传入了自定义的调度器 'scheduler'，该 effect 在首次注册初始化时依然会同步立即执行一次。
答案：对
解析：
💡 它解决了什么问题：
澄清了 scheduler 在生命周期中的真实触发时机。如果不明确首次执行不经过 scheduler，开发者可能会在 scheduler 内部编写依赖初始化的逻辑，导致组件挂载时完全不渲染。

🔍 核心原理解析（防拷打）：
1. 首次触发：裸 effect 或者 RenderEffect 在执行创建时（如 effect.run()），其内部的函数会被立即同步执行一次。
2. 这次同步执行是必不可少的，因为只有运行了函数，才能读取响应式数据，从而触发 getter，建立 target -> key -> effect 的 targetMap 订阅者依赖树。如果首次不执行，将永远无法收集到依赖。
3. 进一步拓展大厂面试追问：在 Vue 3 的 watch 选项中，如果我们配置了 immediate: true，它是如何改变这一执行链路的？配置后，watch 内部会立即同步运行一次回调函数以返回初始值；若未配置，watch 会在首次执行仅做依赖收集，真正的回调执行会被挂载到后续的 scheduler 触发中。

### Q11 [single]
在手写 Vue 3 的异步调度队列 'queueJob' + 'flush' 机制中，对于关联了调度器的 effect，连续赋值 'state.a = 10; state.b = 20; state.c = 30' 后，最终额外会触发几次输出？
A. 3 次（15、33、60）
B. 2 次
C. 1 次（60）
D. 0 次（全部合并取消）
答案：C
解析：
💡 它解决了什么问题：
验证了异步调度去重引擎在面对真实状态改变时的最终响应逻辑，帮助开发者构建确定性、高性能的数据计算流程。

🔍 核心原理解析（防拷打）：
1. 状态覆盖：连续 3 次赋值会同步触发 3 次 scheduler。然而，3 次入队 queueJob(runner) 中，由于 runner 的引用是同一个，Set 队列会将后两次的入队动作静默忽略。
2. 最终 flush 执行时，队列中只包含这一个唯一的任务，运行该任务读取数据源，此时数据源的值已经是最后一次赋值的最新值（60），从而实现了一次性精准更新。
3. 进一步拓展大厂面试追问：如果这 3 次连续赋值中，前两次是有意义的中间态数据，且我们需要将其分别发送给后台 API，但又不能影响 UI 更新，应该怎么设计？绝不能依赖 RenderEffect。应当在组件外使用裸 effect，或者手写防抖/节流函数，或者在 watch 中关闭批处理选项。

### Q12 [multiple]
在 Vue 3 中，关于组件渲染 effect（RenderEffect）与无调度器的裸 effect 之间的区别，以下哪些是正确的？
A. 裸 effect 同步执行，适合调试和追踪精确的响应时机
B. RenderEffect 通过 scheduler 延迟执行，适合合并多次数据变更后统一更新视图
C. 两者底层都使用 ReactiveEffect，本质上是同一套响应式机制
D. RenderEffect 比裸 effect 更早收到依赖变化通知
答案：ABC
解析：
💡 它解决了什么问题：
系统性梳理了 Vue 响应式引擎的核心分层，指导开发者在特定场景下合理选择裸 effect、computed、watch 或组件状态，避免滥用。

🔍 核心原理解析（防拷打）：
1. 机制共性：无论是组件更新还是裸 effect，底层全都是基于一套 ReactiveEffect 响应式拦截机制，都会在读取数据时 track，修改数据时 trigger。
2. 调度差异：裸 effect 在 trigger 时无条件同步直接执行；而组件 RenderEffect 挂载了自定义 queueJob 的 scheduler 从而实现了微任务批处理去重，适合高频交互。
3. 进一步拓展大厂面试追问：在 Reactivity 独立包中，如果需要在没有 Vue 运行时组件实例的前提下，让一个裸 effect 具备批处理能力，应该怎么做？可以使用 Vue 3 导出的 effect 并在它的第二个参数中传入自定义 scheduler，然后在 scheduler 中利用微任务队列对副作用函数执行去重调度。