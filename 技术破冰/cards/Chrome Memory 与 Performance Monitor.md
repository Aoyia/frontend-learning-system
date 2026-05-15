---
title: Chrome Memory 与 Performance Monitor
category: 前端性能优化
tags:
  - frontend
  - performance
  - chrome-devtools
  - memory
  - performance-monitor
difficulty: medium
status: draft
created: 2026-04-27
updated: 2026-04-27
---

# Chrome Memory 与 Performance Monitor

## 1. 它属于哪个知识板块？

它属于：

```txt
前端工程化
→ 前端性能优化
→ 性能诊断工具
→ Chrome DevTools
→ 运行时性能 / 内存问题
```

==更具体地说，**Performance Monitor** 是“快速观察页面运行状态”的**仪表盘**，**Memory** 是“定位内存泄漏和对象引用关系”的**分析工具**。==

它们不是优化手段本身，而是帮你回答两个问题：

1. 页面运行时是不是越来越重？
2. 如果越来越重，到底是 CPU、JS Heap、DOM 节点、事件监听器、布局计算，还是对象没有被释放？

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**Chrome Memory / Performance Monitor** 解决的是“页面卡、越用越慢、内存越来越高时，怎么用**数据判断问题在哪**”的问题。==

很多性能问题不是刷新页面就能看到的，而是发生在长期使用中：打开弹窗再关闭、切换路由、滚动列表、拖拽编辑、重复搜索、进入退出大页面。用户会感觉越来越卡，但开发者如果只看代码，很难知道问题来自哪里。

==**Performance Monitor 适合先看趋势，Memory 适合再追根因。**==

### 2.2 核心流程

```txt
打开 Performance Monitor
→ 操作页面并观察实时指标
→ 判断是 CPU / Heap / DOM / Listener / Layout 哪类异常
→ 如果是内存增长，进入 Memory 面板
→ 对比 heap snapshot 或录制 allocation timeline
→ 找到保留对象的引用路径
→ 修改代码后重复同一操作验证
```

### 2.3 关键词清单

1. Performance Monitor：Chrome DevTools 的实时性能监控面板，用图表展示页面运行时指标。
2. CPU usage：CPU 使用率，持续过高通常说明 JavaScript 执行、布局、绘制或其他任务过重。
3. JS heap size：JavaScript 堆内存大小，用来观察对象占用内存是否持续增长。
4. DOM Nodes：页面 DOM 节点数量，重复操作后持续增长可能说明节点没有被清理。
5. JS event listeners：事件监听器数量，持续增长可能说明监听器重复绑定或没有解绑。
6. Layouts / sec：每秒布局次数，频繁升高可能和布局抖动、读写布局属性混用有关。
7. Style recalcs / sec：每秒样式重新计算次数，频繁升高可能说明样式影响范围过大。
8. Memory panel：Chrome DevTools 的内存分析面板，用来做 heap snapshot、allocation timeline、allocation sampling。
9. Heap snapshot：某一刻 JS 堆内存里的对象快照，适合看对象数量、大小和引用路径。
10. Retainers：保留对象的引用链，用来判断是谁还在引用这个对象，导致它不能被 GC。
11. Detached DOM：已经从页面移除、但仍被 JavaScript 引用的 DOM，常见于内存泄漏排查。
12. GC：垃圾回收。内存上升不一定就是泄漏，要看 GC 后基线是否持续升高。

### 2.4 一句面试版

==**Performance Monitor** 是 Chrome DevTools 里的实时运行指标面板，用来快速观察 **CPU、JS Heap、DOM 节点、事件监听器、布局和样式计算**是否异常；**Memory 面板**用于进一步通过 **heap snapshot 和 allocation timeline** 定位对象为什么没有被释放，常用于排查**内存泄漏、Detached DOM 和事件监听器未清理**问题。==

### 2.5 最小 demo / 最小案例

假设一个页面打开和关闭弹窗后越来越卡，可以这样排查：

```txt
1. 打开 DevTools。
2. Command + Shift + P，搜索 Performance monitor。
3. 打开 Performance Monitor。
4. 重复执行：打开弹窗 → 关闭弹窗，循环 10 次。
5. 观察 JS heap size、DOM Nodes、JS event listeners 是否持续上升。
6. 如果持续上升，切到 Memory 面板。
7. 操作前拍一次 Heap snapshot。
8. 重复打开关闭弹窗。
9. 操作后再拍一次 Heap snapshot。
10. 用 Comparison 对比多出来的对象。
11. 选中异常对象，看 Retainers 找是谁还在引用它。
```

判断方式：

```txt
DOM Nodes 一直涨
→ 可能是 DOM 没销毁、列表没清理、第三方组件残留

JS event listeners 一直涨
→ 可能是 addEventListener 后没有 removeEventListener

JS heap size GC 后基线一直涨
→ 可能是数组、缓存、闭包、全局变量、store、定时器还引用对象

Layouts / sec 或 Style recalcs / sec 很高
→ 可能是布局抖动、频繁读写 DOM 尺寸、样式影响范围过大

CPU 使用率持续很高
→ 可能是长任务、轮询、动画、同步计算或渲染过重
```

### 2.6 Memory 和 Performance Monitor 怎么分工？

| 工具 | 适合回答 | 常用场景 |
| --- | --- | --- |
| Performance Monitor | 页面现在是不是变重了？哪类指标在涨？ | 快速观察趋势、复现卡顿、发现 DOM 或监听器增长 |
| Memory | 哪些对象没释放？是谁引用着它？ | 内存泄漏、Detached DOM、闭包缓存、事件监听器未解绑 |
| Performance | 这次交互为什么慢？主线程在忙什么？ | INP 差、长任务、布局绘制开销、脚本执行过重 |
| Lighthouse | 页面整体有哪些优化建议？ | 初步体检、加载性能、最佳实践、SEO、可访问性 |

最实用的顺序是：

```txt
Performance Monitor 先看趋势
→ Memory 查内存根因
→ Performance 查一次交互或加载过程
→ Lighthouse 做整体体检
```

### 2.7 常见误区

1. JS heap size 上升不一定就是内存泄漏，浏览器可能还没触发 GC。
2. 真正要看的是重复操作后，GC 之后的内存基线是否持续升高。
3. DevTools 自己也会影响性能和内存，排查时要保持操作路径稳定。
4. 只拍一张 heap snapshot 通常不够，排查泄漏要对比操作前后。
5. Detached DOM 不一定全部都是业务泄漏，但它是非常值得优先检查的信号。
6. Performance Monitor 只能告诉你“哪里像有问题”，不能直接告诉你“哪一行代码有问题”。

### 2.8 是否值得深入？

值得深入，尤其是你要做前端性能优化、复杂后台系统、低代码平台、长时间运行页面、大表格、大画布、大量组件渲染时。

优先顺序：

1. 先会打开 Performance Monitor，看 CPU、JS heap、DOM nodes、listeners。
2. 再会重复固定操作，观察指标是否持续增长。
3. 然后学会拍 heap snapshot，对比前后差异。
4. 接着学会看 Retainers，定位对象为什么没释放。
5. 最后结合 Performance 面板分析长任务、布局、样式重算和渲染成本。

优先看官方资料：Chrome DevTools Performance Monitor、Chrome DevTools Memory、Heap snapshot、Allocation timeline、Performance panel。

## 3. 选择题自测

### Q1

Performance Monitor 最适合用来做什么？

A. 快速观察页面运行时指标趋势
B. 自动修复内存泄漏
C. 替代所有测试
D. 发布生产环境

答案：A

解析：Performance Monitor 是实时仪表盘，适合先发现 CPU、内存、DOM、监听器、布局等指标是否异常。

### Q2

Memory 面板最适合用来做什么？

A. 查看 CSS 颜色
B. 定位对象为什么没有被释放
C. 编写业务接口
D. 自动生成组件

答案：B

解析：Memory 面板可以通过 heap snapshot、allocation timeline 和 Retainers 分析对象分布和引用关系。

### Q3

重复打开关闭弹窗后，JS event listeners 持续增长，最可能先怀疑什么？

A. 事件监听器重复绑定或没有解绑
B. 图片尺寸太大
C. HTML 标题太长
D. Git 提交太多

答案：A

解析：监听器数量持续增长，常见原因是组件销毁时没有清理绑定。

### Q4

判断内存泄漏时，为什么不能只看 JS heap size 短时间上涨？

A. 因为浏览器可能还没有触发 GC
B. 因为 JS 没有内存概念
C. 因为 DevTools 不能打开
D. 因为 CSS 会覆盖 JS

答案：A

解析：短时间上涨可能是正常分配。更可靠的是看重复操作并 GC 后，基线是否持续上升。

### Q5

Retainers 的作用是什么？

A. 显示谁还在引用某个对象
B. 显示页面路由
C. 显示 CSS 选择器优先级
D. 显示 npm 包版本

答案：A

解析：Retainers 可以帮助判断对象为什么仍然可达，从而定位泄漏链路。
