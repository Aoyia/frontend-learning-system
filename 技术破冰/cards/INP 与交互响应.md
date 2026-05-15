---
title: INP 与交互响应
category: 前端性能优化
tags:
  - frontend
  - performance
  - inp
  - interaction
  - long-task
difficulty: medium
status: draft
created: 2026-04-28
updated: 2026-04-28
---

# INP 与交互响应

## 1. 它属于哪个知识板块？

```txt
前端性能优化
→ Core Web Vitals
→ INP
→ 输入响应 / 长任务 / 渲染范围 / 调度
```

==INP 关心的是用户交互以后，页面多久给出下一次视觉反馈。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**INP 与交互响应**解决的是“**用户点了、输了、拖了，但页面迟迟没反应**”的问题。==

INP 差不一定是接口慢。很多时候是点击回调里同步计算太重、状态更新触发大面积重渲染、主线程被第三方脚本占用、布局和绘制成本太高。

==优化 INP 的核心是缩短一次交互从**输入事件 → 事件回调 → 状态更新 → 渲染绘制**的整条链路。==

### 2.2 核心流程

```txt
定位最慢交互
→ 用 Performance 面板录制
→ 找 input delay / processing duration / presentation delay
→ 看主线程是否有 long task
→ 看事件回调做了什么
→ 看状态更新影响了多少组件或 DOM
→ 拆任务、降优先级、减少渲染范围
→ 验证 INP 是否下降
```

### 2.3 关键词清单

1. INP：Interaction to Next Paint，交互到下一次绘制。
2. input delay：用户输入后，事件回调真正开始执行前的等待时间。
3. processing duration：事件回调和相关同步任务执行时间。
4. presentation delay：处理完成后到下一帧绘制出来的时间。
5. long task：超过 50ms 的主线程任务。
6. event handler：点击、输入、滚动、拖拽等事件回调。
7. render scope：一次状态变更影响的组件或 DOM 范围。
8. debounce / throttle：限制高频事件执行频率。
9. scheduler.yield：主动让出主线程，把长任务切片。
10. Web Worker：把重计算移出主线程。

### 2.4 一句面试版

==INP 优化的核心是把一次交互拆成 **input delay、processing duration、presentation delay**，优先减少主线程长任务、事件回调同步计算和过大的渲染范围；必要时用 **scheduler.yield、postTask、Web Worker、虚拟列表** 等手段让页面更快给出视觉反馈。==

### 2.5 最小 demo / 最小案例

错误方向：

```ts
button.onclick = () => {
  // 点击后先同步算 500ms，用户看不到任何反馈。
  heavyCalculate()
  setVisible(true)
}
```

更好的方向：

```ts
button.onclick = async () => {
  setVisible(true)
  await scheduler.yield()
  await runHeavyWorkInChunks()
}
```

含义：

1. 先给用户视觉反馈。
2. 再把重任务拆批。
3. 能移到 Worker 的重计算，不要放主线程。

### 2.6 常见优化手段

1. 事件回调里少做同步重活。
2. 先更新 UI，再处理非关键计算。
3. 大数组处理分批，让出主线程。
4. 大列表用虚拟滚动。
5. 高频事件节流、防抖、合并更新。
6. 降低状态更新影响范围，避免父级一改全树重渲染。
7. 第三方脚本延后加载或隔离执行。
8. 大计算放 Web Worker。

### 2.7 和 Long Task 的关系

[[Long Task 与主线程让出|Long Task 与主线程让出]] 是 INP 优化里的一个深入专题。INP 是体验指标，Long Task 是常见原因；不是所有 INP 差都来自 Long Task，但 Long Task 是最先排查的方向之一。

## 3. 选择题自测

### Q1

INP 最关注什么？

A. 用户交互后下一次视觉反馈要多久
B. 首屏图片是不是压缩
C. CSS 文件是否合并
D. Git 是否有 tag

答案：A

### Q2

点击后页面无反馈 500ms，最可能先看哪里？

A. 事件回调和主线程长任务
B. README
C. npm 包名
D. 图片 alt

答案：A

### Q3

大计算为什么适合放到 Web Worker？

A. 避免阻塞主线程响应用户输入和渲染
B. 因为 Worker 能修改 DOM
C. 因为 Worker 能自动减少包体积
D. 因为 Worker 不需要通信

答案：A
