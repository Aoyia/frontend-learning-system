---
title: 高频手写题与场景设计
difficulty: 进阶
tags: [scenarios, debounce, promise, virtual-list, deep-clone, event-emitter, permissions, concurrent]
module: scenarios
order: 1
---

# 高频手写题与场景设计

## 一、防抖与节流

### 完整防抖（支持立即执行）

```javascript
function debounce(fn, delay, immediate = false) {
  let timer = null

  const debounced = function(...args) {
    const callNow = immediate && !timer
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (!immediate) fn.apply(this, args)
    }, delay)
    if (callNow) fn.apply(this, args)
  }

  debounced.cancel = function() {
    clearTimeout(timer)
    timer = null
  }

  return debounced
}
```

### 完整节流（时间戳 + 定时器结合版）

```javascript
// 结合版：首次立即执行，最后一次也会执行
function throttle(fn, interval) {
  let lastTime = 0
  let timer = null

  return function(...args) {
    const now = Date.now()
    const remaining = interval - (now - lastTime)

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}
```

## 二、Promise 系列实现

### Promise.all

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('promises must be an array'))
    }
    const results = []
    let resolved = 0
    const len = promises.length

    if (len === 0) return resolve([])

    promises.forEach((p, i) => {
      Promise.resolve(p).then(val => {
        results[i] = val
        resolved++
        if (resolved === len) resolve(results)
      }).catch(reject)
    })
  })
}
```

### Promise.allSettled

```javascript
function promiseAllSettled(promises) {
  return Promise.all(
    promises.map(p =>
      Promise.resolve(p)
        .then(value => ({ status: 'fulfilled', value }))
        .catch(reason => ({ status: 'rejected', reason }))
    )
  )
}
```

### Promise.race

```javascript
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    for (const p of promises) {
      Promise.resolve(p).then(resolve).catch(reject)
    }
  })
}
```

### 并发控制（Limit Concurrency）

```javascript
/**
 * 控制 Promise 并发数量
 * @param {Function[]} tasks - 返回 Promise 的函数数组
 * @param {number} limit - 最大并发数
 */
async function runWithConcurrencyLimit(tasks, limit) {
  const results = []
  const pool = new Set()

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const p = Promise.resolve().then(() => task()).then(val => {
      results[i] = val
      pool.delete(p)
    })
    pool.add(p)

    if (pool.size >= limit) {
      await Promise.race(pool)  // 等待池中最先完成的任务
    }
  }

  await Promise.all(pool)  // 等待剩余任务
  return results
}

// 使用示例
const tasks = Array.from({ length: 10 }, (_, i) =>
  () => new Promise(res => setTimeout(() => res(i), Math.random() * 1000))
)
runWithConcurrencyLimit(tasks, 3).then(console.log)
```

## 三、深克隆

```javascript
function deepClone(value, cache = new WeakMap()) {
  // 基本类型
  if (value === null || typeof value !== 'object') return value

  // 处理循环引用
  if (cache.has(value)) return cache.get(value)

  // 处理特殊对象类型
  if (value instanceof Date) return new Date(value)
  if (value instanceof RegExp) return new RegExp(value)
  if (value instanceof Map) {
    const clone = new Map()
    cache.set(value, clone)
    value.forEach((v, k) => clone.set(deepClone(k, cache), deepClone(v, cache)))
    return clone
  }
  if (value instanceof Set) {
    const clone = new Set()
    cache.set(value, clone)
    value.forEach(v => clone.add(deepClone(v, cache)))
    return clone
  }

  // 处理普通对象/数组
  const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))
  cache.set(value, clone)

  // 克隆 Symbol 键
  const symbolKeys = Object.getOwnPropertySymbols(value)
  for (const key of symbolKeys) {
    clone[key] = deepClone(value[key], cache)
  }

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      clone[key] = deepClone(value[key], cache)
    }
  }

  return clone
}
```

## 四、发布订阅（EventEmitter）

```javascript
class EventEmitter {
  constructor() {
    this._events = Object.create(null)
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = []
    }
    this._events[event].push(listener)
    return this  // 支持链式调用
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener.apply(this, args)
      this.off(event, wrapper)
    }
    wrapper._original = listener  // 保存原始引用，用于 off
    return this.on(event, wrapper)
  }

  emit(event, ...args) {
    const listeners = this._events[event]
    if (!listeners || listeners.length === 0) return false
    listeners.slice().forEach(fn => fn.apply(this, args))
    return true
  }

  off(event, listener) {
    if (!this._events[event]) return this
    this._events[event] = this._events[event].filter(
      fn => fn !== listener && fn._original !== listener
    )
    return this
  }

  removeAllListeners(event) {
    if (event) {
      delete this._events[event]
    } else {
      this._events = Object.create(null)
    }
    return this
  }
}
```

## 五、虚拟列表（Fixed Height）

```javascript
class VirtualList {
  constructor({ container, itemHeight, renderItem, total }) {
    this.container = container
    this.itemHeight = itemHeight
    this.renderItem = renderItem
    this.total = total

    this.scrollTop = 0
    this.containerHeight = container.clientHeight

    // 内部滚动容器
    this.phantom = document.createElement('div')
    this.phantom.style.height = `${total * itemHeight}px`
    this.phantom.style.position = 'relative'

    this.list = document.createElement('div')
    this.list.style.position = 'absolute'
    this.list.style.top = '0'
    this.list.style.width = '100%'

    this.phantom.appendChild(this.list)
    container.appendChild(this.phantom)
    container.style.overflow = 'auto'

    container.addEventListener('scroll', () => {
      this.scrollTop = container.scrollTop
      this.render()
    })

    this.render()
  }

  render() {
    const { itemHeight, containerHeight, scrollTop, total } = this
    const bufferCount = 2
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferCount)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferCount * 2
    const endIndex = Math.min(total - 1, startIndex + visibleCount)

    // 更新偏移
    this.list.style.transform = `translateY(${startIndex * itemHeight}px)`

    // 渲染可见节点
    const fragment = document.createDocumentFragment()
    for (let i = startIndex; i <= endIndex; i++) {
      fragment.appendChild(this.renderItem(i))
    }
    this.list.innerHTML = ''
    this.list.appendChild(fragment)
  }
}
```

## 六、前端权限控制设计

### 路由级权限（Vue Router）

```javascript
// 路由元信息声明权限
const routes = [
  {
    path: '/admin',
    component: AdminPage,
    meta: { requiresAuth: true, roles: ['admin', 'superadmin'] }
  }
]

// 路由守卫统一拦截
router.beforeEach((to, from, next) => {
  const { requiresAuth, roles } = to.meta
  if (!requiresAuth) return next()

  const user = store.state.user
  if (!user) return next('/login')

  if (roles && !roles.includes(user.role)) {
    return next('/403')
  }

  next()
})
```

### 按钮级权限（Vue 指令）

```javascript
// v-permission 自定义指令
app.directive('permission', {
  mounted(el, binding) {
    const userPermissions = store.state.permissions  // ['user:edit', 'order:view']
    const required = binding.value  // 'user:delete'

    if (!userPermissions.includes(required)) {
      el.parentNode?.removeChild(el)  // 无权限直接移除 DOM
    }
  }
})
```

```html
<!-- 使用 -->
<button v-permission="'user:delete'">删除用户</button>
```

### 接口权限（RBAC 模型）

```
用户（User）→ 角色（Role）→ 权限（Permission）→ 资源（Resource）

RBAC 核心：将权限分配给角色，用户通过角色获得权限
优势：权限变更时只需修改角色-权限映射，不需要逐个修改用户
```

## 七、LRU 缓存

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map()  // Map 的迭代顺序是插入顺序
  }

  get(key) {
    if (!this.cache.has(key)) return -1
    // 刷新为最近使用：先删后插
    const val = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, val)
    return val
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // Map.keys().next().value 是最久未使用的键
      this.cache.delete(this.cache.keys().next().value)
    }
    this.cache.set(key, value)
  }
}
```

---

## 📝 面试题自测

### Q1 [single]
在前端交互开发中，防抖（Debounce）最适合的使用场景是？
A. 页面滚动位置同步（需要实时更新）
B. 搜索框输入联想（停止输入后才发请求）
C. 按钮防重复点击（立即执行且有间隔）
D. 鼠标移动轨迹记录
答案：B
解析：
💡 它解决了什么问题：
如果不对高频触发事件（如用户连续快速输入）进行延迟拦截，系统会为每次按键立即向服务器发送 HTTP 请求，或者触发繁重的 DOM 重绘，导致服务端面临流量压力，同时导致前端页面严重掉帧、卡顿，体验急剧退化。

🔍 核心原理解析（防拷打）：
1. 核心原理是使用定时器延迟闭包机制。在每次事件触发时，强制重置并清除（clearTimeout）前一次未执行的延迟器。只有在用户动作停止且维持指定的 delay 间隔之后，才真正触发回调函数的执行。
2. 在工程取舍上，防抖机制会导致事件执行存在固有的滞后性。对于需要立即响应而又需要控制频率的场景，则应当结合使用支持 immediate: true（立即执行一次，随后进入冷却）的防抖，或者使用能够保障高频下均匀调度的“节流”。
3. 大厂追问：如果在防抖触发的异步过程中，组件发生了卸载（Unmount），如何防范待触发防抖回调执行导致的“在已销毁组件上操作状态（Memory Leak）”？需在防抖函数上暴露出 cancel 方法，在组件生命周期卸载钩子中主动执行 cancel() 以销毁闭包内的定时器引用。

### Q2 [single]
在 JavaScript 异步编程中，`Promise.all` 和 `Promise.allSettled` 最关键的区别是？
A. all 更快，allSettled 更准确
B. all 任一 rejected 就整体 rejected；allSettled 等所有完成，每个结果都有 status 字段
C. allSettled 不支持 async/await
D. all 只接受 Promise 数组，allSettled 也接受普通值
答案：B
解析：
💡 它解决了什么问题：
如果只使用 Promise.all，一旦任何一个接口或异步操作发生失败（Rejected），整个操作流会立即中断并抛出异常，导致其它已经成功返回的数据被无情抛弃，无法在部分请求失败的场景下展示可用数据，也无法在批量任务中搜集所有子任务的状态。

🔍 核心原原理析（防拷打）：
1. Promise.all 采用的是 Fail-Fast（快速失败）机制，内部任意一个 Promise 失败即立刻调用外层 Promise 的 reject；而 Promise.allSettled 内部则将每一个传入的 Promise 都包裹一层安全兜底拦截，无论其成功还是失败，均会捕获其结果并重塑为 { status: 'fulfilled', value } 或 { status: 'rejected', reason } 的标准结构，最终以 Resolved 状态输出。
2. 工程取舍上，Promise.all 适合强关联的串联事务（如必须同时获取用户信息和权限配置才能渲染页面）；而 Promise.allSettled 适合弱关联的批量任务（如批量下载文件列表、仪表盘加载多个独立的统计卡片），极大增强了页面的容灾韧性（Resilience）。
3. 大厂追问：在不支持 Promise.allSettled 的旧版浏览器环境下，如何仅使用 Promise.all 优雅地模拟出 allSettled 的行为？可通过对传入的 Promise 数组进行 .map(p => Promise.resolve(p).then(val => ({ status: 'fulfilled', value: val }), err => ({ status: 'rejected', reason: err }))) 的方式进行结构包裹，然后再传入 Promise.all 即可。

### Q3 [judgment]
在手写 JavaScript 深拷贝（深克隆）函数时，使用 `WeakMap` 记录已拷贝对象是为了防止函数调用栈溢出。
答案：错
解析：
💡 它解决了什么问题：
如果不处理循环引用（例如对象 A 引用了对象 B，而对象 B 的属性又指回 A），深拷贝函数在深度优先递归（DFS）时将陷入无止境的死循环，最终耗尽 JavaScript 的引擎调用栈，抛出致命的 Maximum call stack size exceeded 内存溢出错误。

🔍 核心原原理析（防拷打）：
1. 核心原理是使用哈希映射缓存表（Graph Visited Table）。在开始拷贝对象前，先检查该对象是否已经记录在 WeakMap 中。若已存在，直接返回其之前创建的克隆对象指针，从而打破深度优先搜索的图回路（Cycles）。
2. 为什么选用 WeakMap 而不是普通的 Map？因为 WeakMap 的 Key 对对象是弱引用（Weak Reference），不会干扰垃圾回收器（Garbage Collector）对被克隆对象的正常回收。如果使用强引用的 Map，一旦克隆了巨型数据，这些数据将被拷贝函数内的缓存一直占用，极易造成严重的内存泄漏。
3. 大厂追问：如果克隆的对象极深且层级达到数千层（非循环引用），仅仅依赖 WeakMap 能防止栈溢出吗？不能，因为本质上它依然是通过递归调用栈工作的。要彻底杜绝这类极端边界下的调用栈溢出，必须改用迭代模拟栈（DFS/BFS Loop with Manual Queue/Stack），在堆内存中维护一个待拷贝的任务队列，将隐式的调用栈转换为显式的数据结构。

### Q4 [multiple]
在手写 JavaScript 发布订阅模式中的 `EventEmitter.once()` 监听器时，有哪些关键实现点？
A. 使用 wrapper 函数包裹原始监听器
B. 在 wrapper 执行完原始监听器后，调用 off 移除 wrapper 自身
C. 在 wrapper 上挂载 `_original` 属性，保存原始函数引用，以便 off 时匹配
D. 必须使用 Symbol 作为事件名
答案：ABC
解析：
💡 它解决了什么问题：
如果不引入 once 的专属解绑逻辑，针对那些仅需执行一次的特定动作（如首屏初始化加载、一次性的网关握手），开发人员需要在业务监听器内部手动编写繁琐的 off 销毁代码，极易因为报错分支未执行而导致监听器常驻内存，引发内存泄漏与高频重复回调。

🔍 核心原原理析（防拷打）：
1. 核心设计模式是代理/包装模式（Decorator/Wrapper Pattern）。once 函数并不直接将原始监听器（Listener）注册到事件队列中，而是生成一个包装函数（Wrapper）。该包装函数在被 emit 触发时，首先执行原始监听器，随后立即执行 this.off() 将自身从队列中踢出，确保只被调用一次。
2. 工程取舍上，为了确保当消费方在外部手动调用 emitter.off(event, originalListener) 时也能正常将对应的包装函数解绑，必须在包装函数上挂载一个属性（如 wrapper._original = originalListener），以便在执行过滤匹配时能识别出真实身份。
3. 大厂追问：如果在 once 包裹的监听器内部又同步触发了 emit 该事件，会导致什么结果？这可能导致监听器在被 off 之前发生重入。为了保证鲁棒性，在 emit 触发遍历时，应当使用 listeners.slice() 克隆一份当前快照进行调用，从而防止在迭代执行过程中由于动态增删订阅队列导致的选择性跳过或死循环。

### Q5 [single]
在前端长列表渲染性能优化中，虚拟列表（Virtual List）的核心收益来自哪里？
A. 减少了 JavaScript 计算量
B. 使用了 CSS GPU 加速
C. 将 DOM 节点数量控制在固定范围内（视口内），不随数据量增长
D. 使用了 Web Worker 在后台渲染
答案：C
解析：
💡 它解决了什么问题：
如果直接在 DOM 树中渲染十万条列表数据，浏览器会因为要创建海量的 DOM 节点而耗尽内存。更致命的是，每一次轻微的滚动都会触发重排与重绘（Reflow & Repaint），使得 FPS 瞬间掉到个位数，导致页面完全卡死。

🔍 核心原原理析（防拷打）：
1. 核心原理是：基于视口计算的 DOM 复用机制。在运行时，虚拟列表并不一次性把所有数据灌入 DOM 树，而是通过监听外部容器的滚动事件（scrollTop），计算出当前可见区域（Viewport）的首尾索引值（startIndex 和 endIndex），仅仅渲染该区间及其前后缓冲区（Buffer）内的 DOM 元素。
2. 在工程取舍上，虚拟列表虽然极大削减了渲染层面的 CPU 与内存占用，但它给浏览器无障碍访问（屏幕阅读器无法读取视口外的数据）以及页面的内置搜索（Command + F 无法查找到未渲染内容）带来了局限。因此，通常需要合理控制可视区缓冲区的大小（如预渲染两屏的数据）。
3. 大厂追问：当列表子项的高度是不固定的（动态高度，受内容文字行数影响），如何精准计算滚动偏移量与定位可视区？必须引入“估算高度 + 动态测量（Dynamic Profiling & Skeleton）”策略。预先假设一个平均高度进行占位，在列表项实际渲染到 DOM 后，利用 ResizeObserver 或是读取 offsetHeight 动态修正该项的高度缓存与 Phantom 滚动容器的总高，并利用二分查找快速修正后续项的 transform: translateY 偏移定位。

### Q6 [judgment]
在 JavaScript 的 `Promise.race()` 竞态机制中，如果最快完成的 Promise 是 rejected，则整体 race 的结果就是 rejected。
答案：对
解析：
💡 它解决了什么问题：
在网络超时控制、竞态请求等高并发时序敏感的场景中，如果不引入快速判定机制，系统就无法立即知道哪个请求或操作“最先完成（无论其是成是败）”，导致后续依赖首个响应的逻辑陷入停滞，浪费用户等待时间。

🔍 核心原原理析（防拷打）：
1. Promise.race 的底层原理是为传入的 Promise 列表中的每一个实例，挂载同一个外层 Promise 的 resolve 和 reject 作为其回调。这意味着一旦其中第一个实例进入了 Settled 状态（不管是 Fulfilled 还是 Rejected），它便会抢先触发外层控制器的状态转移，使后发或慢速的 Promise 实例的状态改变动作永久失效。
2. 工程取舍上，Promise.race 无法得知落败的 Promise 究竟是成功还是失败，且无法中途强行中断那些已经发出去的异步操作（例如已经发出的 HTTP 请求仍会继续传输，耗费带宽），它仅能在代码逻辑层面“忽略”其后续行为。
3. 大厂追问：在执行 Promise.race 模拟接口请求超时时，如何防止超时 reject 后，原本的 Fetch 请求依然占用 HTTP 连接通道导致浏览器最大并发数被占满？必须配合 AbortController 信号。当超时计时器的 Promise 率先胜出时，不仅 reject，更应当在 Catch 块中调用 controller.abort() 主动阻断底层网络请求的 I/O。

### Q7 [single]
在 JavaScript 中手写实现 LRU（最近最少使用）缓存时，使用 `Map` 替代普通 Object 的关键优势是利用了 Map 的什么特性？
A. Map 的键可以是任意类型，避开了对键的强制字符串序列化转换
B. Map 的迭代顺序与插入顺序一致，可以通过 keys().next().value 获取最久未使用的键
C. Map 的 delete 删键操作不会导致 V8 引擎内部发生隐藏类（Hidden Class）降级或字典模式退化
D. Map 底层哈希表在发生碰撞时能够通过红黑树结构实现 O(1) 的常数级查找性能
答案：B
解析：
💡 它解决了什么问题：
如果使用传统的 Object 作为 LRU 缓存的哈希表，由于 Object 的键值迭代是无序的（受数字键等规则影响），若要查找“最久未被访问的键”以腾出缓存空间，必须去遍历整个对象并维护访问时间戳，使得淘汰操作的时间复杂度劣化为 O(N)，导致高频缓存失效时性能暴跌。

🔍 核心原原理析（防拷打）：
1. 核心原理是利用 ES6 Map 具有“保序性”的链表式底层设计。在 Map 中，键的迭代顺序开发等同于其被插入的先后顺序（Insertion Order）。因此，LRU 的“刷新访问状态”操作可以优雅地表达为“先 delete 键，紧接着重新 set 该键”，使得最常用的数据逐步推到 Map 尾部，而 map.keys().next().value 就能以 O(1) 的时间复杂度稳定获取到处于头部、最久未被访问的键。
2. 在工程取舍上，虽然直接用 Map 能够用极简的代码实现功能，但 Map 底层依旧是由 JS 引擎黑盒管理的。如果在内存极度受限、或是超大规模缓存（百万级）场景下，更彻底的选型是手写“双向链表 + 哈希表”结构，以便更精准地控制每个节点的指针和内存分配。
3. 大厂追问：如果 LRU 缓存中的某些数据是异步获取的，当同一个 Key 在缓存未命中的瞬间被并发请求了多次，如何避免缓存击穿引发的重复网络请求？可以采用“缓存 Promise 实例”的策略。在 Map 的 Value 中不存实际结果，而是直接存放该数据的请求 Promise，所有并发调用方共享这同一个 Promise，待其 resolve 后缓存自然生效。

### Q8 [multiple]
在 JavaScript 异步并发控制（如限制网络请求最大并发数）中，以下哪些说法是正确的？
A. 核心思路是维护一个"任务池"，池满时等待最先完成的任务
B. 使用 `Promise.race(pool)` 可以等待池中最先完成的任务
C. 并发控制可以防止同时发出过多网络请求导致服务器压力过大
D. 并发数越大，总耗时一定越短
答案：ABC
解析：
💡 它解决了什么问题：
如果不引入并发控制机制，当面临海量异步任务（如大文件切片上传、大批量图片预加载）时，系统会瞬间向浏览器和服务器发送数十甚至上百个并发网络请求。这会导致浏览器网络线程池（通常限制同一域名最大并发 6 个）产生严重的队头阻塞、TCP 连接耗尽，同时可能击垮服务端网关，甚至导致浏览器页面因内存溢出（OOM）或请求丢包而崩溃。

🔍 核心原理解析（防拷打）：
1. 核心原理是利用“任务队列（Task Queue）”与“滑动窗口（Sliding Window）”机制来实现并发控制。内部维护一个运行中的 Promise 集合（即任务池）以及一个等待执行的任务队列，初始化时启动至多 limit 个并发任务。每当任务池中的任意一个任务完成（无论是 Resolve 还是 Reject），都通过 Promise 链式回调触发下一个排队任务的执行，以此维持稳定的并发饱和度。
2. 工程取舍上，虽然可以使用 Promise.race 动态监控正在执行的 Promise 数组以提取最先完成者，但在大型项目或高频调用中，直接使用辅助变量（如 runningCount 计数器）在每个 Promise 的 finally 中递归自调用，能避免频繁创建和销毁 Promise.race 产生的 GC 压力，具备更高的执行效能。
3. 进一步拓展大厂面试追问：当并发池中的某个请求发生网络抖动而无限挂起时，如何防范它永久占用并发插槽导致整体队列“假死”？必须为并发池中的每个任务配备一个带有超时竞态（AbortController）的熔断器。当某个任务在规定时间内未完成，立即通过 abort 终止网络请求，并将其从并发池中移出，同时记录失败日志并触发重试机制（指数退避重试）。

### Q9 [single]
在前端权限控制架构中，典型的 RBAC（基于角色的访问控制）模型里权限被分配给谁？
A. 直接分配给每个用户
B. 分配给角色，用户通过角色间接获得权限
C. 分配给接口 URL
D. 分配给前端路由路径
答案：B
解析：
💡 它解决了什么问题：
如果不引入 RBAC（基于角色的访问控制）模型，而将权限（如“导出报表”、“修改价格”）直接平铺分配给具体的用户个体，会导致用户数量膨胀时授权链路极其臃肿。当员工离职、入职或岗位调动时，管理员需要对数百个独立的权限点进行逐一配置，这极易引发“权限遗留”等重大系统安全合规隐患（例如离职员工依然拥有敏感数据的下载权限）。

🔍 核心原理解析（防拷打）：
1. 核心原理是利用了三层实体映射的设计模式（用户 -> 角色 -> 权限），即“多对多”的双向解耦。在数据库和权限引擎中，角色（Role）作为中介阻断了用户（User）和细粒度权限（Permission）的直接绑定。用户只要被指派了某个角色，便能动态继承该角色关联的全部权限集合，从而实现“一次修改，全局生效”。
2. 在工程取舍上，RBAC 虽然解决了授权效率，但对于诸如“只允许修改自己创建的订单”这类依赖上下文属性的动态权限（ABAC，基于属性 of 访问控制），单纯的 RBAC 就会失效。在前端工程中，常常采用 RBAC 配合拦截函数（Policy），把用户角色、组织架构以及业务资源的所有权作为综合变量进行判断。
3. 进一步拓展大厂面试追问：在超大型组织中，由于角色数量过多（如数千个业务线角色）导致用户登录时下发的权限列表（Token）过大，如何避免前端频繁请求导致的 HTTP 头溢出（Header Too Large）？可采用前端缓存策略配合渐进式菜单加载，在用户初次访问特定子系统时才按需向权限网关换取局部细粒度操作权限的鉴权结果。

### Q10 [judgment]
在 Vue 的权限管理实践中，自定义指令 `v-permission` 通过 CSS `display: none` 隐藏无权限元素被视为最佳安全实践。
答案：错
解析：
💡 它解决了什么问题：
如果不将无权限的敏感 UI 元素（如“后台管理”按钮、“敏感金额”输入框）从 DOM 树中彻底剥离，而仅仅通过 CSS（如 display: none 或者是 visibility: hidden）进行隐藏，黑客或有心用户可以通过浏览器开发者工具（DevTools）直接修改 CSS 属性或注入 JS 来使元素复现，甚至能直接调用绑定在 DOM 节点上的 click 事件，从而造成应用安全防线的全面崩溃和敏感越权操作。

🔍 核心原理解析（防拷打）：
1. 核心原理是：基于 DOM 树物理隔离的防御式设计。在 MVVM 框架中，真正的权限控制必须借助运行时指令（如 Vue 中的 v-if 或自定义指令在 mounted/inserted 阶段利用 removeChild 物理移除）或编译期条件渲染，使得无权限节点根本不生成对应的 AST 或者是虚拟 DOM（VNode），从而阻断敏感数据的下发与事件交互的入口。
2. 工程取舍上，通过自定义指令（如 v-permission）在 DOM 渲染后进行 removeChild 移除，虽然使用简单，但其存在短暂的“回流闪烁”问题（元素会先生成再被移除）；因此，对于极度敏感的操作区，最佳实践应当是使用函数式组件、路由级懒加载守卫或直接使用 v-if 条件渲染，在 vnode 挂载前就完成拦截。
3. 进一步拓展大厂面试追问：仅仅在前端执行 DOM 移除，就能确保系统绝对安全吗？不能。前端的所有控制都属于 UI 层面的交互辅助（Obfuscation）。大厂架构中必须遵循“前端权限决定视觉呈现，后端权限决定数据安全”的原则。前端移除 DOM 的同时，必须在 API 网关和微服务拦截器中对对应的 HTTP 接口进行严格的 Session/JWT 角色与操作权（Resource-Action）的双重校验。

### Q11 [single]
在 JavaScript 的各种深拷贝（深克隆）方案中，哪种常用方案完全无法克隆函数和 undefined 值？
A. 手写递归深克隆
B. `JSON.parse(JSON.stringify(obj))`
C. `structuredClone(obj)`
D. lodash 的 `_.cloneDeep`
答案：B
解析：
💡 它解决了什么问题：
如果在一个复杂的业务系统（如富文本编辑器数据源、复杂的图表配置对象）中盲目使用 `JSON.parse(JSON.stringify(obj))` 进行数据克隆，会导致函数（Function）、undefined、Symbol 属性静默丢失，Date 对象退化为 ISO 字符串，Map/Set 沦为空对象，循环引用直接导致抛错白屏。这会导致在后续的数据流转中由于方法缺失或类型破裂而发生致命的运行时故障。

🔍 核心原理解析（防拷打）：
1. JSON 序列化底层是基于 JSON 规范的数据类型子集设计。在执行 stringify 时，非 JSON 规范的值（如函数、undefined、Symbol）在对象属性中会被静默忽略，在数组中会被转换为 null，而在单独调用时返回 undefined。同时它也无法重建复杂的原型链与对象引用网络。
2. 工程取舍上，`JSON.parse(JSON.stringify(obj))` 的唯一优势在于执行速度极快（由引擎层 C++ 原生实现，且无需考虑复杂的自定义类和循环引用）。因此，在确认克隆对象只包含纯 JSON 安全的数据类型（如常规 API 响应数据）时，它是性价比最高的深拷贝选型。
3. 进一步拓展大厂面试追问：原生的 `structuredClone()` 已经能解决大部分问题，但它为什么依然不能作为全能深拷贝方案？因为 `structuredClone` 依然无法克隆 Function、Symbol、RegExp 以及 DOM 节点，并且不支持自定义原型的克隆。在需要保留复杂类实例（含有构造器和方法）的业务场景中，必须使用手写深度优先遍历（DFS）并配合 WeakMap 或引入 Lodash 的 cloneDeep。

### Q12 [multiple]
在开发前端搜索框自动补全（Autocomplete）联动功能时，以下哪些是必须考虑和处理的问题？
A. 使用防抖减少请求频率
B. 处理竞态条件（后发的请求先返回覆盖了正确结果）
C. 使用节流保证实时响应
D. 取消上一次未完成的请求（AbortController）
答案：ABD
解析：
💡 它解决了什么问题：
如果在开发搜索联动、模糊查询等交互功能时，直接将输入框的 input 事件绑定到网络请求，会产生两重致命缺陷：一是高频的网络请求会耗尽系统资源；二是由于网络传输的波动，先发出的请求可能因为阻塞而后返回，从而覆盖了后发请求的正确结果（即异步竞态冲突），导致搜索框展示出错误的、与当前输入内容不匹配的陈旧联想结果。

🔍 核心原理解析（防拷打）：
1. 核心原理是采用“时序隔离”与“连接中断”的设计模式。防抖（Debounce）负责在交互入口处限流，仅在用户停止输入指定时间后才发起请求；而 AbortController 或“版本递增标记（Version Tagging）”则用于解决网络竞态问题，每当新的请求发起时，主动调用上一次请求 of abort() 方法使旧请求废弃，确保只有最后一次触发的 Promise 结果被渲染到 UI。
2. 工程取舍上，相比直接 abort 掉底层网络连接，使用“请求版本标识（Request Index）”在 JS 内存中忽略落后请求虽然实现成本更低，但它无法为浏览器腾出 HTTP 通道。因此，在 HTTP/1.1 等仍受连接数限制的场景下，结合 AbortController 才是最优解。
3. 进一步拓展大厂面试追问：当用户在网络极差的情况下高频打字，频繁的 abort 请求是否会导致浏览器或网关层的额外性能开销？是的。在极度高频且对性能敏感的场景下，可以引入基于 Trie 树（前缀树）的本地内存缓存（如 React Query/SWR 的数据缓存机制）。对于已经请求过的前缀词（如“react”），直接从缓存读取，避免发起无效的 abort 链路。

### Q13 [single]
在手写实现一个支持 `cancel()` 注销方法的防抖函数时，该 `cancel` 函数的核心作用是？
A. 清除当前计时器，阻止待执行的函数运行
B. 立即执行待执行的函数
C. 将防抖延迟重置为默认值
D. 取消事件监听
答案：A
解析：
💡 它解决了什么问题：
当防抖函数在异步延迟（如 500ms）等待执行时，如果触发了组件的卸载（Unmount）、路由跳转或页面切换，闭包内定时器引用的回调函数依然会在到期后强行执行。这不仅会尝试修改已销毁组件的状态从而导致 React/Vue 抛出内存泄漏与无意义报错，而且可能会触发已经失效的业务逻辑（如在非当前页弹出提示框），造成应用行为混乱。

🔍 核心原理解析（防拷打）：
1. 核心设计是闭包生命周期与垃圾回收（Garbage Collection）的手动干预。cancel 函数的核心工作原理是通过外部暴露的钩子，主动执行 clearTimeout(timer) 销毁闭包内维持的定时器标识符，并将 timer 变量置为 null，解除定时器对回调函数及其周围上下文环境的闭包强引用，使其能被垃圾回收器顺利回收。
2. 在工程取舍上，防抖的 cancel 函数对于防止内存泄漏至关重要。但很多开发者只在组件内使用 debounce，却漏掉了在销毁钩子（如 Vue 的 beforeUnmount、React 的 useEffect return cleanup）中调用 cancel，这就让架构层面的防抖保护效果大打折扣。
3. 进一步拓展大厂面试追问：除了 cancel 之外，如何实现一个能在触发紧急业务时“立即强制执行（Flush）”的防抖函数？可以为防抖函数挂载一个 flush 方法：如果定时器存在，则立即清除定时器，并以当前缓存的 arguments 同步调用原始回调函数，从而实现“从异步延迟到同步立即结算”的平滑切换。

### Q14 [judgment]
在 JavaScript 中，`Promise.allSettled` 返回的 Promise 本身永远不会被 reject，而是总是走向 fulfilled。
答案：对
解析：
💡 它解决了什么问题：
如果在处理多路并行的异构任务（如同时请求推荐列表、广告、以及天气卡片）时使用 Promise.all，若其中一个非核心的“天气卡片”请求由于接口报错被 Reject，整个 Promise 链会瞬间断裂抛错，导致其它核心卡片的数据也无法渲染。allSettled 解决了全局容灾问题，保障系统不因局部的失败而整体瘫痪。

🔍 核心原理解析（防拷打）：
1. 核心原理是状态容器的重新封装。Promise.allSettled 内部建立了一个统一的拦截器，它会拦截每个子 Promise 的 catch 链路。无论子 Promise 最终是 Fulfilled 还是 Rejected，均会统一转换为 Resolved 状态，并将其各自 of status、value 或 reason 封装到一个标准的结果对象中，以此确保外层容器 Promise 的执行链路永远走向 then 而非 catch。
2. 工程取舍上，使用 allSettled 会使调用方必须写额外的遍历代码去筛选和校验每个结果的 status（如 result.status === 'fulfilled'）。如果是针对强依赖关系的任务（如获取 Token 和拉取用户信息），依然应当使用 Promise.all 让其快速失败以减少后续无效的网络开销。
3. 进一步拓展大厂面试追问：如何基于 Promise.allSettled 实现一个“部分容错（M out of N）”的并发机制（如发出 5 个请求，只要成功 3 个即可立即 resolve，否则全部失败才 reject）？需要借助计数器逻辑。在每一个 Promise 的 resolve/reject 回调中动态累加成功和失败计数，当成功数达到阈值时提前 resolve 外层 Promise，否则在所有任务结束仍未达标时整体 reject。

### Q15 [multiple]
在手写 JavaScript 深拷贝（深克隆）函数时，需要特殊处理哪些引用类型以确保正确克隆而不是丢失其原型或属性？
A. Date 对象（new Date(value) 重建）
B. RegExp 对象（new RegExp(value) 重建）
C. Map 和 Set（递归克隆每个键值）
D. null（视为普通对象递归）
答案：ABC
解析：
💡 它解决了什么问题：
如果深拷贝函数对所有对象均采用统一的“创建空对象，然后 for...in 循环递归”方案，会导致 Date 对象丢失时间戳退化为普通的空 Object，RegExp 的正则规则与修饰符（如 global, ignoreCase）全部丢失，Map/Set 内的数据结构被彻底擦除，甚至会因为 null 对象的 typeof 为 'object' 导致递归报错，最终导致克隆后的复杂业务数据实体直接失效。

🔍 核心原理解析（防拷打）：
1. 核心原理是利用类型分流（Type Dispatching）与原型链继承的重建。在克隆前，通过 Object.prototype.toString.call(value) 精准检测出其实际内置类型。针对 Date 使用 new Date(value.getTime())，针对 RegExp 使用 new RegExp(value.source, value.flags)，针对 Map/Set 则分别通过 new Map() 和 new Set() 实例化新容器，并递归克隆其中的键和值。
2. 工程取舍上，对于复杂的引用对象（如 DOM 元素、Window 对象、或者含有内部闭包状态的对象），深拷贝很难在保持完整功能的前提下进行完美复制（因为无法克隆事件监听器或闭包环境）。在架构设计上，应当通过“不可变数据（Immutability）”或仅克隆纯数据实体来规避对这类复杂系统级对象进行深拷贝。
3. 进一步拓展大厂面试追问：如何处理带有自定义原型链（Prototype）的对象克隆，以确保克隆后的对象依然是同一个自定义类的实例（能够调用原型链上的方法）？应当利用 Object.create(Object.getPrototypeOf(source)) 创建一个继承了源对象原型的新对象，在此基础上再结合 Object.assign 或递归复制其自身的属性，从而保障原型链（Prototype Chain）不发生断裂。

### Q16 [single]
在手写 JavaScript 节流（Throttle）函数时，以下哪种常见方式能实现“首次调用立即执行，之后按间隔节流”的效果？
A. 普通节流（时间戳版）
B. 普通防抖
C. 防抖的 `immediate: true` 模式
D. 节流的时间戳 + 定时器结合版
答案：A
解析：
💡 它解决了什么问题：
如果不使用时间戳来实现节流，而单纯使用定时器（setTimeout）延时触发，会导致事件首次触发时也必须等待 delay 的延迟时间（例如点击后过了 300ms 才有反应）。这对于用户高频交互（如点击发帖按钮、滑动菜单展开）会产生明显的视觉卡顿感，极大地破坏了应用的即时交互响应体验。

🔍 核心原理解析（防拷打）：
1. 核心原理是基于系统绝对时钟的计算。时间戳版本节流的核心公式为 `now - lastTime >= interval`。在初始化时，`lastTime` 被赋予 0。当用户首次调用时，`now - 0` 必然远大于指定的 `interval`，因而触发了条件分支，使得回调函数被立即同步执行。随后将 `lastTime` 更新为当前的 `now`，后续调用则进入等待冷却。
2. 工程取舍上，单纯的时间戳版本在停止高频调用后，最后一次触发的动作会因为不满足 `now - lastTime >= interval` 而被静默丢弃（无尾随执行）；而单纯的定时器版则无法首次立即执行（无首发执行）。因此，在实际工业级交互（如拖拽调整大小、滚动吸顶）中，最完美的设计是结合“时间戳 + 定时器”，既保证首次立即触发，又保证最后一次输入会被尾随定时器补发执行（Trailing）。
3. 进一步拓展大厂面试追问：在多端开发中（如小程序或 Hybrid WebView 容器），如果客户端系统的绝对时间戳由于网络对时被意外篡改（或用户手动修改了手机系统时间），基于时间戳的节流函数可能会面临“永久锁死（lastTime 大于 now）”或“节流失效”的 Bug，该如何治理？应当引入高精度时间 API（如浏览器环境下的 performance.now()），它返回一个自页面加载后以恒定速率增长的单调时间戳（Monotonic Clock），不受系统本地时间校准的干扰。
