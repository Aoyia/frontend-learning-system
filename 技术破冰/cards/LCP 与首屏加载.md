---
title: LCP 与首屏加载
category: 前端性能优化
tags:
  - frontend
  - performance
  - lcp
  - loading
  - images
difficulty: medium
status: draft
created: 2026-04-28
updated: 2026-04-28
---

# LCP 与首屏加载

## 1. 它属于哪个知识板块？

```txt
前端性能优化
→ Core Web Vitals
→ LCP
→ 首屏加载 / 关键资源 / 渲染阻塞
```

==LCP 不是“页面所有东西加载完”，而是**首屏最大内容元素什么时候真正画出来**。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**LCP 与首屏加载**解决的是“**页面打开后主要内容迟迟不出现**”的问题。==

首屏慢可能不是图片太大一个原因。HTML 回来慢、CSS 阻塞、字体阻塞、JS 客户端渲染、接口慢、LCP 图片发现得太晚，都会让 LCP 变差。

==优化 LCP 的核心不是只压图片，而是让**LCP 元素更早被发现、更早下载、更少被阻塞、更快渲染**。==

### 2.2 核心流程

```txt
找到 LCP 元素
→ 判断它是图片、文本、视频还是背景图
→ 拆 LCP 子阶段：TTFB / load delay / load duration / render delay
→ 看 HTML 是否太慢
→ 看关键 CSS / 字体 / JS 是否阻塞渲染
→ 看 LCP 资源是否发现太晚或优先级太低
→ 优化后用 DevTools 和 RUM 验证
```

### 2.3 关键词清单

1. LCP element：首屏最大内容元素，可能是 hero 图、标题、视频封面、大文本块。
2. TTFB：HTML 首字节时间，服务端、网络、CDN 都会影响它。
3. resource load delay：资源被发现之前的等待时间。
4. resource load duration：资源真正下载花的时间。
5. render delay：资源下载完后到真正渲染出来的时间。
6. critical CSS：首屏渲染必须的 CSS。
7. render-blocking resources：阻塞渲染的 CSS、同步脚本等资源。
8. preload：提前告诉浏览器某个关键资源很重要。
9. fetchpriority：提示浏览器提高或降低资源请求优先级。
10. lazy loading：延迟加载非首屏资源；首屏 LCP 图通常不应该 lazy。

### 2.4 一句面试版

==LCP 优化的核心是先找到**首屏最大内容元素**，再拆成 **TTFB、资源发现延迟、资源下载耗时、渲染延迟** 四段，分别优化服务端响应、关键资源优先级、图片/字体/CSS 阻塞和客户端渲染链路。==

### 2.5 最小 demo / 最小案例

首屏 hero 图常见写法：

```html
<link
  rel="preload"
  as="image"
  href="/hero.avif"
  fetchpriority="high"
>

<img
  src="/hero.avif"
  width="1200"
  height="640"
  fetchpriority="high"
  alt="产品主图"
>
```

注意：

1. 首屏 LCP 图不要 `loading="lazy"`。
2. 图片要有 `width` / `height` 或稳定的 CSS 宽高，避免顺手制造 CLS。
3. 如果 LCP 是 CSS background-image，它可能被发现得更晚，优先考虑真实 `<img>`。

### 2.6 常见优化手段

1. 服务端和 CDN：减少 TTFB，缓存 HTML 或接口，离用户更近。
2. HTML：让 LCP 资源尽早出现在 HTML 中，不要等 JS 执行后才插入。
3. 图片：合适尺寸、AVIF/WebP、压缩、`srcset`、`sizes`、首屏优先级。
4. CSS：减少首屏阻塞 CSS，避免大 CSS 文件阻塞主内容。
5. 字体：减少字体文件数量，合理使用 `font-display`，避免字体阻塞文本 LCP。
6. JS：减少首屏必须执行的 JS，避免 hydration 或大框架初始化挡住 LCP。

### 2.7 排查口令

```txt
LCP 差
→ 最大元素是谁？
→ 它是不是首屏真正关键内容？
→ 它什么时候被 HTML 发现？
→ 它的资源下载慢不慢？
→ 下载完为什么还没画？
→ 是 CSS、字体、JS、接口还是服务端挡住了？
```

## 3. 选择题自测

### Q1

LCP 关注的是什么？

A. 首屏最大内容元素什么时候画出来
B. 所有图片是否全部下载完
C. 页面有没有 TypeScript 报错
D. Git 是否提交成功

答案：A

### Q2

首屏 LCP 图片通常不应该怎么做？

A. 设置 `loading="lazy"`
B. 设置宽高
C. 控制图片体积
D. 提前发现关键资源

答案：A

### Q3

LCP 图片下载完但迟迟不显示，优先怀疑什么？

A. render delay，例如 CSS、JS、字体或客户端渲染阻塞
B. 浏览器的网络请求排队（Queueing）时间过长
C. 服务端响应没有正确设置 Content-Disposition 响应头
D. TCP 连接握手时发生丢包重传

答案：A
