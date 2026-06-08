# Markdown Mermaid 流程图全屏预览与缩放平移 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现 Markdown 渲染出的 Mermaid 流程图点击全屏查看并支持鼠标滚轮缩放、鼠标拖拽平移的高颜值交互功能。

**架构：**
1. 在 Hook `useMarkdownEnhancements.js` 中，当 Mermaid 渲染 SVG 后，为其动态包裹并追加悬浮按钮和点击事件。
2. 点击后在 `body` 动态生成全屏 Modal 弹窗，并克隆 SVG 插入其中。
3. 全屏 Modal 内部使用 CSS 3D Transform，通过以鼠标为中心的数学缩放算法和基于坐标滑动的拖拽平移算法控制 SVG 缩放与移动。
4. 控制面板采用磨砂玻璃质感设计，集成了放大、缩小、适应屏幕和关闭按钮。

**技术栈：** 原生 JavaScript DOM & CSS 3D Transform

---

### 任务 1：[样式设计] 在 `index.css` 中追加全屏预览 Modal 以及相关控件的 CSS 样式

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/index.css`

- [ ] **步骤 1：追加 CSS 样式**

在 `/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/index.css` 底部添加以下内容：

```css
/* ==========================================================================
   Mermaid 流程图全屏预览增强样式
   ========================================================================== */

/* 1. 原生文档中的 Mermaid 容器增强 */
.mermaid {
  position: relative;
  cursor: zoom-in;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  border-radius: 8px;
}
.mermaid:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 悬浮全屏预览激活按钮 */
.mermaid-zoom-trigger {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #a0aec0;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.mermaid:hover .mermaid-zoom-trigger {
  opacity: 1;
  transform: scale(1);
}
.mermaid-zoom-trigger:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

/* 2. 全屏预览弹窗 Modal 遮罩层 */
.mermaid-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  background-color: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;
  opacity: 0;
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.mermaid-preview-modal.show {
  opacity: 1;
}

/* 视口容器 */
.preview-viewport {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
}
.preview-viewport:active {
  cursor: grabbing;
}

/* 缩放平移包裹层 */
.preview-transform-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}
.preview-transform-wrapper svg {
  max-width: none !important;
  max-height: none !important;
  height: auto;
  user-select: none;
  pointer-events: none; /* 防止 SVG 内部链接或文本干扰拖动 */
}

/* 3. 控制面板与按钮 */
.mermaid-preview-modal .preview-close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 100001;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}
.mermaid-preview-modal .preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: rotate(90deg);
}

.preview-control-bar {
  position: absolute;
  bottom: 32px;
  z-index: 100001;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 99px;
  background: rgba(30, 30, 30, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.preview-control-bar .control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 99px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}
.preview-control-bar .control-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.preview-control-bar .control-btn svg {
  stroke-width: 2.25;
}

.preview-control-bar .control-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

.preview-control-bar .btn-close {
  color: #ff5f56;
}
.preview-control-bar .btn-close:hover {
  background: rgba(255, 95, 86, 0.15);
  color: #ff5f56;
}
```

- [ ] **步骤 2：提交样式修改**

```bash
git add src/index.css
git commit -m "style: add custom styles for mermaid zoom and fullscreen preview modal"
```

---

### 任务 2：[逻辑实现] 修改 `useMarkdownEnhancements.js`，实现对 Mermaid SVG 的事件绑定和全屏 Modal 拖拽缩放逻辑

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/hooks/useMarkdownEnhancements.js`

- [ ] **步骤 1：添加逻辑以引入悬浮按钮与全屏双重点击绑定**

在 `mermaid.run` 结束后触发的处理逻辑：
```javascript
      // 遍历所有渲染出的 .mermaid 容器进行全屏扩展绑定
      const mermaidWrappers = document.querySelectorAll('.md-body .mermaid');
      mermaidWrappers.forEach(wrapper => {
        // 防止重复绑定
        if (wrapper.querySelector('.mermaid-zoom-trigger')) return;

        // 创建悬浮放大按钮
        const trigger = document.createElement('button');
        trigger.className = 'mermaid-zoom-trigger';
        trigger.setAttribute('title', '全屏查看流程图');
        trigger.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;

        wrapper.appendChild(trigger);

        // 绑定点击事件：点击按钮或双击图表放大
        const svgElement = wrapper.querySelector('svg');
        if (!svgElement) return;

        const openPreview = (e) => {
          e.stopPropagation();
          initMermaidPreview(svgElement);
        };

        trigger.addEventListener('click', openPreview);
        wrapper.addEventListener('click', openPreview);
      });
```

- [ ] **步骤 2：编写完整的 `initMermaidPreview` 预览和缩放平移算法**

在 `useMarkdownEnhancements.js` 文件的合适位置或作为内部闭包实现 `initMermaidPreview(srcSvg)` 方法：

```javascript
function initMermaidPreview(srcSvg) {
  // 1. 克隆 SVG 节点并移除固有尺寸限制
  const clonedSvg = srcSvg.cloneNode(true);
  clonedSvg.removeAttribute('width');
  clonedSvg.removeAttribute('style');
  clonedSvg.style.width = '100%';
  clonedSvg.style.height = '100%';

  // 2. 动态创建 Modal DOM 结构并插入
  const modal = document.createElement('div');
  modal.className = 'mermaid-preview-modal';
  modal.innerHTML = `
    <button class="preview-close-btn" title="关闭 (Esc)">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <div class="preview-viewport">
      <div class="preview-transform-wrapper"></div>
    </div>
    <div class="preview-control-bar">
      <button class="control-btn" id="btn-zoom-in" title="放大">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        <span>放大</span>
      </button>
      <button class="control-btn" id="btn-zoom-out" title="缩小">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        <span>缩小</span>
      </button>
      <button class="control-btn" id="btn-zoom-reset" title="适应屏幕">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        <span>适应屏幕</span>
      </button>
      <span class="control-divider"></span>
      <button class="control-btn btn-close" id="btn-close">关闭</button>
    </div>
  `;

  const viewport = modal.querySelector('.preview-viewport');
  const wrapper = modal.querySelector('.preview-transform-wrapper');
  wrapper.appendChild(clonedSvg);
  document.body.appendChild(modal);

  // 动画淡入
  requestAnimationFrame(() => modal.classList.add('show'));

  // 3. 核心交互状态变量
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  const minScale = 0.15;
  const maxScale = 8;

  // 4. 平移与缩放矩阵更新函数
  const updateTransform = (withTransition = false) => {
    wrapper.style.transition = withTransition ? 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
    wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  };

  // 5. 居中自适应初始化函数
  const fitToScreen = () => {
    const viewWidth = viewport.clientWidth;
    const viewHeight = viewport.clientHeight;
    
    // 获取 SVG viewBox 的宽高，如没有则使用默认尺寸
    const viewBox = srcSvg.viewBox.baseVal;
    const svgWidth = viewBox.width || srcSvg.clientWidth || 600;
    const svgHeight = viewBox.height || srcSvg.clientHeight || 400;

    // 计算最佳缩放比例，预留 15% 的边距
    const scaleX = (viewWidth * 0.85) / svgWidth;
    const scaleY = (viewHeight * 0.85) / svgHeight;
    scale = Math.min(scaleX, scaleY, 1.2); // 限制最大初始比例为 1.2
    
    // 平移归零
    translateX = 0;
    translateY = 0;
    updateTransform(true);
  };

  // 触发首次居中
  setTimeout(fitToScreen, 50);

  // 6. 以鼠标为中心的平滑滚轮缩放事件
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const rect = wrapper.getBoundingClientRect();
    
    // 鼠标相对于变换包装器中心（包括之前的平移）的偏移值
    const mouseX = e.clientX - rect.left - translateX;
    const mouseY = e.clientY - rect.top - translateY;
    
    // 计算即将缩放的新倍数
    const oldScale = scale;
    const delta = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    scale = Math.min(Math.max(minScale, scale * delta), maxScale);
    
    // 关键数学公式：微调平移变量以确保鼠标指针下方的图像位置静止
    translateX -= mouseX * (scale / oldScale - 1);
    translateY -= mouseY * (scale / oldScale - 1);
    
    updateTransform(false);
  };

  viewport.addEventListener('wheel', handleWheel, { passive: false });

  // 7. 拖拽平移事件绑定
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform(false);
  };

  const handleMouseUp = () => {
    isDragging = false;
  };

  viewport.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  // 8. 操作按钮事件绑定
  const zoomIn = () => {
    const oldScale = scale;
    scale = Math.min(scale * 1.25, maxScale);
    // 从中心放大
    translateX = translateX * (scale / oldScale);
    translateY = translateY * (scale / oldScale);
    updateTransform(true);
  };

  const zoomOut = () => {
    const oldScale = scale;
    scale = Math.max(scale / 1.25, minScale);
    // 从中心缩小
    translateX = translateX * (scale / oldScale);
    translateY = translateY * (scale / oldScale);
    updateTransform(true);
  };

  modal.querySelector('#btn-zoom-in').addEventListener('click', zoomIn);
  modal.querySelector('#btn-zoom-out').addEventListener('click', zoomOut);
  modal.querySelector('#btn-zoom-reset').addEventListener('click', fitToScreen);

  // 9. 关闭销毁逻辑与事件解绑
  const destroyModal = () => {
    modal.classList.remove('show');
    // 监听淡出动画结束后移除节点
    setTimeout(() => {
      // 彻底移除全局监听器，防止内存泄漏
      viewport.removeEventListener('wheel', handleWheel);
      viewport.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      modal.remove();
    }, 250);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      destroyModal();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  modal.querySelector('.preview-close-btn').addEventListener('click', destroyModal);
  modal.querySelector('#btn-close').addEventListener('click', destroyModal);
  
  // 点击遮罩空白区域关闭弹窗（限定触发源必须是 viewport 自身，防止点击控制面板误关）
  viewport.addEventListener('click', (e) => {
    if (e.target === viewport) {
      destroyModal();
    }
  });
}
```

- [ ] **步骤 3：提交 Hook 逻辑修改**

```bash
git add src/hooks/useMarkdownEnhancements.js
git commit -m "feat(markdown): implement pan-and-wheel-zoom interactive preview for rendered mermaid diagrams"
```

---

### 任务 3：[手动验证] 在浏览器中手动测试和验证全屏交互行为

- [ ] **步骤 1：打开运行中的开发服务器页面**

访问 `http://localhost:5173`。

- [ ] **步骤 2：测试悬浮和触发按钮**

打开任意包含 Mermaid 流程图的文章。
1. 将鼠标指针移动到流程图上，确认右上角流畅渐显出全屏按钮，且鼠标样式变为 zoom-in 手势。
2. 点击按钮，检查 Modal 弹窗是否带毛玻璃效果平滑展现。

- [ ] **步骤 3：测试滚轮缩放和平移**

1. 在 Modal 中，使用鼠标滚轮，验证是否可以放大、缩小流程图。
2. 确认缩放时是否精确以鼠标当前的指针悬浮点为原点进行缩放，没有剧烈漂移。
3. 按住鼠标左键拖拽，验证流程图是否以 `grabbing` 状态紧随指针移动。

- [ ] **步骤 4：测试控制栏及快捷键关闭**

1. 点击控制栏的 "放大" 和 "缩小" 按钮，确认能以中心点为基础进行过渡缩放。
2. 点击 "适应屏幕"，确认流程图自适应居中到初始大小。
3. 点击 "关闭"、点击遮罩背景、或在键盘按下 `Esc`，验证弹窗是否以淡出动效消失。
