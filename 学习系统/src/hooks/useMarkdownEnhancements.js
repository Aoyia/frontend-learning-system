import { useEffect } from 'react';
import hljs from 'highlight.js';

export function useMarkdownEnhancements({ page, currentModuleId, currentDocIdx, quizPageIdx, submittedPages, theme }) {
  useEffect(() => {
    document.querySelectorAll('pre code:not(.language-mermaid)').forEach(el => hljs.highlightElement(el));

    let cancelled = false;

    (async () => {
      const hasMermaidCode = document.querySelector('.md-body pre code.language-mermaid')
        || document.querySelector('.md-body .mermaid');
      if (!hasMermaidCode) return;

      const { default: mermaid } = await import('mermaid');
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: theme === 'light' ? 'default' : 'dark',
      });

      document.querySelectorAll('.md-body').forEach(body => {
        body.querySelectorAll('pre code.language-mermaid').forEach(codeEl => {
          const source = codeEl.textContent || '';
          const wrapper = document.createElement('div');
          wrapper.className = 'mermaid';
          wrapper.setAttribute('data-mermaid-source', source);
          wrapper.textContent = source;
          const pre = codeEl.closest('pre');
          if (pre) pre.replaceWith(wrapper);
        });

        body.querySelectorAll('.mermaid[data-mermaid-source]').forEach(el => {
          const source = el.getAttribute('data-mermaid-source') || '';
          el.textContent = source;
          el.removeAttribute('data-processed');
        });
      });

      const nodes = Array.from(document.querySelectorAll('.md-body .mermaid'));
      if (nodes.length) {
        mermaid.run({ nodes })
          .then(() => {
            if (cancelled) return;
            // 确保 DOM 稳定，稍微延迟后绑定事件
            setTimeout(() => {
              if (cancelled) return;

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

                // 绑定点击事件：点击按钮或流程图本身放大
                const svgElement = wrapper.querySelector('svg');
                if (!svgElement) return;

                const openPreview = (e) => {
                  e.stopPropagation();
                  initMermaidPreview(svgElement);
                };

                trigger.addEventListener('click', openPreview);
                wrapper.addEventListener('click', openPreview);
              });
            }, 100);
          })
          .catch(() => {
            // Mermaid 语法错误时保留原始文本，避免页面崩溃。
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, currentModuleId, currentDocIdx, quizPageIdx, submittedPages, theme]);
}

function initMermaidPreview(srcSvg) {
  // 1. 克隆 SVG 节点并清理其固定的宽高样式，保证能在包裹容器中自由拉伸
  const clonedSvg = srcSvg.cloneNode(true);
  clonedSvg.removeAttribute('style');
  clonedSvg.removeAttribute('width');
  clonedSvg.removeAttribute('height');

  const viewBox = srcSvg.viewBox ? srcSvg.viewBox.baseVal : null;
  const svgWidth = (viewBox && viewBox.width) ? viewBox.width : (srcSvg.clientWidth || 600);
  const svgHeight = (viewBox && viewBox.height) ? viewBox.height : (srcSvg.clientHeight || 400);

  clonedSvg.setAttribute('width', svgWidth);
  clonedSvg.setAttribute('height', svgHeight);
  clonedSvg.style.width = `${svgWidth}px`;
  clonedSvg.style.height = `${svgHeight}px`;

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
    const viewRect = viewport.getBoundingClientRect();

    // 鼠标相对于 viewport 左上角的坐标
    const mx = e.clientX - viewRect.left;
    const my = e.clientY - viewRect.top;

    // viewport 的中心点
    const cx = viewRect.width / 2;
    const cy = viewRect.height / 2;

    // 计算即将缩放的新倍数
    const oldScale = scale;
    const delta = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    scale = Math.min(Math.max(minScale, scale * delta), maxScale);

    const factor = scale / oldScale;

    // 以鼠标位置为缩放中心的平移补偿公式
    translateX = translateX * factor + (mx - cx) * (1 - factor);
    translateY = translateY * factor + (my - cy) * (1 - factor);

    updateTransform(false);
  };

  viewport.addEventListener('wheel', handleWheel, { passive: false });

  // 7. 拖拽平移事件绑定
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging = true;
    viewport.style.cursor = 'grabbing';
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
    if (isDragging) {
      isDragging = false;
      viewport.style.cursor = 'grab';
    }
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
      viewport.removeEventListener('click', handleViewportClick);
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
  const handleViewportClick = (e) => {
    if (e.target === viewport) {
      destroyModal();
    }
  };
  viewport.addEventListener('click', handleViewportClick);
}

