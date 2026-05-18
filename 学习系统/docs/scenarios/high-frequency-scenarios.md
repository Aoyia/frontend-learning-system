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
防抖（Debounce）最适合的使用场景是？
A. 页面滚动位置同步（需要实时更新）
B. 搜索框输入联想（停止输入后才发请求）
C. 按钮防重复点击（立即执行且有间隔）
D. 鼠标移动轨迹记录
答案：B
解析：防抖是"停止触发后延迟执行"，适合搜索框等场景。滚动/鼠标移动适合节流。按钮防重复点击可以用节流或 loading 状态控制。

### Q2 [single]
`Promise.all` 和 `Promise.allSettled` 最关键的区别是？
A. all 更快，allSettled 更准确
B. all 任一 rejected 就整体 rejected；allSettled 等所有完成，每个结果都有 status 字段
C. allSettled 不支持 async/await
D. all 只接受 Promise 数组，allSettled 也接受普通值
答案：B
解析：Promise.all 失败快（fail-fast）；Promise.allSettled 等所有 Promise 完成（无论成功/失败），返回 [{status: 'fulfilled', value}, {status: 'rejected', reason}] 格式。

### Q3 [judgment]
深克隆中使用 `WeakMap` 缓存处理过的对象，是为了防止栈溢出。
答案：错
解析：WeakMap 缓存的目的是处理**循环引用**（A 引用 B，B 又引用 A）。防止栈溢出需要改用迭代代替递归，或限制递归深度。WeakMap 使用弱引用，不影响 GC。

### Q4 [multiple]
实现 `EventEmitter.once()` 的关键点有哪些？
A. 使用 wrapper 函数包裹原始监听器
B. 在 wrapper 执行完原始监听器后，调用 off 移除 wrapper 自身
C. 在 wrapper 上挂载 `_original` 属性，保存原始函数引用，以便 off 时匹配
D. 必须使用 Symbol 作为事件名
答案：ABC
解析：once 的实现要点：包裹一层 wrapper（A），触发后自动解绑（B），为了支持 `emitter.off(event, originalFn)` 还需要能从 wrapper 找到原始函数（C）。D 不是必需的。

### Q5 [single]
虚拟列表的核心性能收益来自哪里？
A. 减少了 JavaScript 计算量
B. 使用了 CSS GPU 加速
C. 将 DOM 节点数量控制在固定范围内（视口内），不随数据量增长
D. 使用了 Web Worker 在后台渲染
答案：C
解析：虚拟列表的本质是"只渲染看得见的 DOM"，无论数据有 1000 条还是 100 万条，DOM 节点数始终只有约 20-50 个，因此渲染和操作开销是 O(1) 而不是 O(n)。

### Q6 [judgment]
`Promise.race()` 中，如果最快完成的 Promise 是 rejected，则 race 的结果就是 rejected。
答案：对
解析：Promise.race 以第一个 settle（无论 fulfilled 还是 rejected）的 Promise 决定结果。最快的 reject 了，race 就 reject。

### Q7 [single]
LRU 缓存使用 `Map` 实现的关键是利用了 Map 的什么特性？
A. Map 的键可以是任意类型
B. Map 的迭代顺序与插入顺序一致，可以通过 keys().next().value 获取最久未使用的键
C. Map 比 Object 占用更少内存
D. Map 的 get/set 操作时间复杂度是 O(log n)
答案：B
解析：LRU 通过"先删后插"刷新访问顺序，Map 的插入序迭代特性使得 `map.keys().next().value` 始终是最早插入（最久未访问）的键，完美实现 LRU 的淘汰逻辑。

### Q8 [multiple]
关于并发控制（Concurrency Limit），以下哪些说法正确？
A. 核心思路是维护一个"任务池"，池满时等待最先完成的任务
B. 使用 `Promise.race(pool)` 可以等待池中最先完成的任务
C. 并发控制可以防止同时发出过多网络请求导致服务器压力过大
D. 并发数越大，总耗时一定越短
答案：ABC
解析：D 错误，并发数超过服务器连接限制后，反而会因为排队或失败降低效率。合理的并发数（如 3-5）往往是最优的。

### Q9 [single]
前端 RBAC（基于角色的访问控制）模型中，权限分配给谁？
A. 直接分配给每个用户
B. 分配给角色，用户通过角色间接获得权限
C. 分配给接口 URL
D. 分配给前端路由路径
答案：B
解析：RBAC 的核心是"用户→角色→权限"三层模型。将权限分配给角色而非用户，当需要调整权限时只需修改角色配置，而不用逐个修改数百个用户。

### Q10 [judgment]
`v-permission` 指令通过 CSS `display: none` 隐藏无权限元素是最佳实践。
答案：错
解析：CSS 隐藏的 DOM 元素仍然存在于页面中，用户可以通过 DevTools 或修改 CSS 看到/显示它们；更安全的做法是在 mounted 钩子中用 `el.parentNode.removeChild(el)` 直接移除 DOM 节点。

### Q11 [single]
以下深克隆方案中，哪种方案无法克隆函数和 undefined 值？
A. 手写递归深克隆
B. `JSON.parse(JSON.stringify(obj))`
C. `structuredClone(obj)`
D. lodash 的 `_.cloneDeep`
答案：B
解析：JSON 序列化会丢失 undefined、函数、Symbol、循环引用会报错，RegExp/Date 会被转为字符串。structuredClone 支持循环引用但不支持函数，手写和 lodash 支持最全面。

### Q12 [multiple]
以下哪些是实现搜索框自动补全需要考虑的问题？
A. 使用防抖减少请求频率
B. 处理竞态条件（后发的请求先返回覆盖了正确结果）
C. 使用节流保证实时响应
D. 取消上一次未完成的请求（AbortController）
答案：ABD
解析：C 错误，节流会在停止输入时跳过最后一次，不适合搜索；防抖（A）才合适。竞态（B）和取消请求（D）是必须处理的问题。

### Q13 [single]
实现一个支持 `cancel()` 方法的防抖函数，cancel 的作用是？
A. 清除当前计时器，阻止待执行的函数运行
B. 立即执行待执行的函数
C. 将防抖延迟重置为默认值
D. 取消事件监听
答案：A
解析：cancel 用于主动取消还未执行的防抖任务（如组件卸载时），防止内存泄漏或在已销毁的组件上执行回调。

### Q14 [judgment]
`Promise.allSettled` 返回的 Promise 本身不会 reject，总是 fulfill。
答案：对
解析：allSettled 等所有 Promise settle 后，以包含所有结果对象的数组 resolve，不会因为个别 Promise 的 rejection 而整体 reject。

### Q15 [multiple]
深克隆中，需要特殊处理哪些类型以确保正确克隆？
A. Date 对象（new Date(value) 重建）
B. RegExp 对象（new RegExp(value) 重建）
C. Map 和 Set（递归克隆每个键值）
D. null（视为普通对象递归）
答案：ABC
解析：D 错误，null 的 typeof 是 'object' 但它不是对象，需要在最开始判断 `value === null` 直接返回。Date/RegExp/Map/Set 都需要用各自的构造函数重建才能正确克隆。

### Q16 [single]
以下哪种方式实现"首次立即执行，之后节流"的效果？
A. 普通节流（时间戳版）
B. 普通防抖
C. 防抖的 `immediate: true` 模式
D. 节流的时间戳 + 定时器结合版
答案：A
解析：时间戳版节流：第一次调用时 `now - lastTime >= interval`（lastTime 为 0）立即执行；此后每次调用都需要等间隔时间才再次执行。这正是"首次立即执行，之后节流"。
