---
title: CLS 与视觉稳定
category: 前端性能优化
tags:
  - frontend
  - performance
  - cls
  - layout-shift
  - stability
difficulty: medium
status: draft
created: 2026-04-28
updated: 2026-04-28
---

# CLS 与视觉稳定

## 1. 它属于哪个知识板块？

```txt
前端性能优化
→ Core Web Vitals
→ CLS
→ 布局偏移 / 尺寸预留 / 字体 / 异步内容
```

==CLS 关心的不是页面慢不慢，而是页面内容会不会**突然乱跳**。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**CLS 与视觉稳定**解决的是“**用户正在看或准备点，页面突然挤开或跳动**”的问题。==

这类问题非常影响体验：按钮突然下移、广告插入把正文挤走、图片加载后撑开布局、字体替换导致文本重新排版。

==优化 CLS 的核心是让页面在资源和异步内容真正到达之前，就已经为它们**预留稳定空间**。==

### 2.2 核心流程

```txt
找到发生偏移的元素
→ 判断偏移来源：图片 / 广告 / iframe / 字体 / 异步内容 / 动画
→ 给不确定尺寸的内容预留空间
→ 避免在已有内容上方插入新内容
→ 控制字体替换和动画属性
→ 用 DevTools Layout Shifts 验证
→ 用 RUM 看线上 CLS 是否下降
```

### 2.3 关键词清单

1. CLS：Cumulative Layout Shift，累计布局偏移。
2. layout shift：可见元素在两帧之间位置变化。
3. unexpected shift：非用户输入直接触发的偏移。
4. reserved space：预留空间，提前给图片、广告、异步内容占位。
5. intrinsic size：资源自身尺寸，例如图片的宽高比例。
6. aspect-ratio：CSS 宽高比，用来稳定布局。
7. font swap：字体加载后替换 fallback 字体，可能造成文本跳动。
8. skeleton：骨架屏，关键是尺寸接近最终内容。
9. transform animation：用 transform 做动画通常比改 top/left 更稳定。
10. Layout Shifts track：DevTools 里查看布局偏移的记录。

### 2.4 一句面试版

==CLS 优化的核心是避免可见内容发生非预期位移：给**图片、广告、iframe、异步组件、骨架屏**提前预留尺寸，控制**字体替换**和上方内容插入，并用 DevTools 的 Layout Shifts 记录定位具体偏移元素。==

### 2.5 最小 demo / 最小案例

图片要写稳定尺寸：

```html
<img
  src="/banner.webp"
  width="1200"
  height="600"
  alt="活动横幅"
>
```

异步卡片预留空间：

```css
.async-card-skeleton {
  min-height: 240px;
}

.media {
  aspect-ratio: 16 / 9;
}
```

不要这样：

```ts
// 接口回来后突然在页面顶部插入一块大内容。
container.prepend(promoBanner)
```

### 2.6 常见来源和处理

1. 图片无宽高：补 `width` / `height` 或 `aspect-ratio`。
2. 广告位尺寸不确定：预留最大或常见尺寸，失败时保留占位。
3. iframe / embed：预留容器尺寸。
4. 字体替换：减少字体体积，合理设置 fallback 和 `font-display`。
5. 异步内容：骨架屏尺寸接近最终内容。
6. 动画：优先 transform / opacity，避免改布局属性。

## 3. 选择题自测

### Q1

CLS 主要衡量什么？

A. 页面是否发生非预期布局偏移
B. JS 包体积
C. 接口状态码
D. Git 提交速度

答案：A

### Q2

图片导致 CLS 的常见原因是什么？

A. 没有预留宽高，加载后撑开布局
B. 图片在首屏未能启用懒加载（loading="lazy"）属性
C. 资源未在服务端配置强缓存（max-age）导致重复拉取
D. 网络协商缓存失效导致图片渲染失败

答案：A

### Q3

骨架屏为什么也可能造成 CLS？

A. 骨架屏尺寸和最终内容差异太大
B. 骨架屏是灰色
C. 骨架屏没有 JavaScript
D. 骨架屏不能被 CSS 控制

答案：A
