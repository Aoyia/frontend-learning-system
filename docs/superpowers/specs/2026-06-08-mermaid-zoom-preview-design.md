# Markdown Mermaid 流程图全屏预览与缩放平移设计方案

本方案旨在为前端学习系统中的 Markdown 渲染出的 Mermaid 流程图（SVG 格式）提供高颜值的全屏放大、缩放、平移等交互功能，借鉴主流文档系统（如 Notion、Obsidian 插件）的成熟做法，采用零外部依赖的原生 JavaScript + CSS 实现。

---

## 1. 目标与用户体验设计 (UI/UX)

为了提供符合 Premium 质感的视觉效果，交互被分为两个核心阶段：

### 1.1. 文档中 Mermaid 容器的悬浮状态
*   **布局与提示**：每个渲染完成的 `.mermaid` 容器在 CSS 中被赋予 `position: relative` 和 `cursor: zoom-in` 属性。
*   **全屏按钮**：鼠标悬停在图表上时，右上角渐显一个精致的毛玻璃全屏按钮。
    *   **图标**：使用简洁的 Lucide 风格的 `Maximize2` (全屏) 矢量图标。
    *   **样式**：磨砂玻璃背景（`backdrop-filter: blur(8px); background: rgba(var(--color-surface-rgb), 0.6); border: 1px solid var(--color-border);`）。
*   **触发行为**：点击全屏按钮或点击流程图本身，均可进入全屏预览。

### 1.2. 全屏查看 Modal 弹窗
在 `document.body` 中动态插入一个具有 `fixed` 定位的预览遮罩层，其内部 DOM 结构如下：
```html
<div class="mermaid-preview-modal" id="mermaid-preview-modal">
  <!-- 右上角关闭按钮 -->
  <button class="preview-close-btn" title="关闭 (Esc)">
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
  
  <!-- 视口容器 -->
  <div class="preview-viewport">
    <div class="preview-transform-wrapper">
      <!-- 动态插入的克隆 SVG 节点 -->
    </div>
  </div>
  
  <!-- 底部居中控制面板 -->
  <div class="preview-control-bar">
    <button class="control-btn" id="btn-zoom-in" title="放大">
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
      <span>放大</span>
    </button>
    <button class="control-btn" id="btn-zoom-out" title="缩小">
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
      <span>缩小</span>
    </button>
    <button class="control-btn" id="btn-zoom-reset" title="居中还原">
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
      <span>适应屏幕</span>
    </button>
    <span class="control-divider"></span>
    <button class="control-btn btn-close" id="btn-close">
      <span>关闭</span>
    </button>
  </div>
</div>
```

*   **遮罩层样式**：深色背景加模糊特效（`background-color: rgba(10, 10, 10, 0.82); backdrop-filter: blur(16px);`），无论页面当前是 Light 还是 Dark 主题，全屏预览均以深色调呈现，使亮色的流程图线条或深色的流程图线条在纯净背景下都具有极佳的清晰度与高档质感。
*   **控制面板样式**：高颜值磨砂玻璃面板，使用 CSS Grid/Flex 均匀排布，悬浮时按钮具有发光微阴影与轻微的位移动效。

---

## 2. 核心交互算法设计

交互处理是本方案的技术重点，确保缩放、拖拽顺滑自然：

### 2.1. 以鼠标为中心的缩放 (Zoom-to-Mouse)
为了防止缩放时目标区域漂移出可视范围，缩放时必须保持鼠标指针下方的图像位置相对于鼠标是不变的。
```javascript
// 核心坐标修正算法
const handleWheel = (e) => {
  e.preventDefault();
  const zoomFactor = 0.1;
  const rect = viewport.getBoundingClientRect();
  
  // 鼠标在 viewport 中的相对坐标
  const mouseX = e.clientX - rect.left - translateX;
  const mouseY = e.clientY - rect.top - translateY;
  
  // 计算新的 scale 并作边界值（0.1 ~ 10 倍）限制
  const nextScale = Math.min(Math.max(0.1, scale + (e.deltaY < 0 ? zoomFactor : -zoomFactor) * scale), 10);
  
  // 核心公式：基于比例修正平移量，实现以鼠标位置为中心缩放
  translateX -= mouseX * (nextScale / scale - 1);
  translateY -= mouseY * (nextScale / scale - 1);
  scale = nextScale;
  
  updateTransform();
};
```

### 2.2. 平滑拖拽与平移 (Drag & Pan)
*   监听 `mousedown`、`mousemove`、`mouseup`/`mouseleave`。
*   在 `mousedown` 时，记录当前鼠标坐标，设置状态 `isDragging = true`。
*   在 `mousemove` 中，动态计算移动差并更新 `translateX` 和 `translateY`。
*   拖动时，设置容器 `cursor: grabbing`。为了拖拽顺滑，移动期间将克隆 SVG 的 `transition` 设为 `none`，停止时恢复。

### 2.3. 居中自适应 (Fit-Screen & Center)
*   点击 “适应屏幕” 或首次打开时，自动获取克隆 SVG 内部的 `viewBox` 信息或 `getBBox()` 尺寸，与当前窗口的可用宽度和高度对比。
*   计算出自适应的长宽比例，将 scale 初始化为 `fitScale`，并将 translateX 和 translateY 重置为 0，使流程图垂直水平完美居中于 viewport 中。

---

## 3. 代码架构与系统集成

### 3.1. Hook 集成
本增强功能主要作用于 Markdown 动态加载与渲染周期的尾部，在 `/src/hooks/useMarkdownEnhancements.js` 内：
*   在 `mermaid.run({ nodes })` 执行成功后，调用 `initMermaidZoom()`，该方法遍历所有 `.mermaid svg`，为其包裹或追加点击与悬浮事件。
*   提供一个公共样式文件（或在现有的 `index.css` / 新建 CSS 中），写入预览弹窗的各类交互样式。

### 3.2. 优雅卸载与垃圾回收
*   当点击“关闭”按钮、遮罩空白处、或按键盘 `Esc` 时，平滑淡出并销毁 Modal 节点。
*   同时，在 Hook 的 `useEffect` 清理函数中，自动移除全局绑定的 `window` 级别事件（如 `keydown`、`mousemove` 等），杜绝 SPA 应用中的内存泄露风险。
