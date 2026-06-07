# 禅模式极简刷题界面 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现极致视觉降噪的“禅模式”刷题界面，通过去除大色块与边框，优化留白，强化微交互与左侧边线反馈。

**架构：**
1. 重构 `src/index.css` 中的刷题和侧边呼吸点导航样式，确保在亮暗主题下均遵循无背景、左指示线的流光反馈。
2. 调整 `QuestionBlock.jsx`、`QuizPage.jsx` 和 `AnswerCard.jsx` 中的样式类名、内间距和按键提示。
3. 启动本地开发服务，并在亮暗模式下以手动答题、鼠标悬停、键盘快捷操作来闭环测试整个禅模式的效果。

**技术栈：** React, CSS (Variables, Flexbox, Transitions)

---

### 任务 1：重构 CSS 样式定义 (index.css)

**文件：**
- 修改：`学习系统/src/index.css:1167-1206`（禅模式刷题样式重构）
- 修改：`学习系统/src/index.css:1210-1250`（Immersive Dots 与悬停面板）
- 修改：`学习系统/src/index.css:1000-1069`（去除 Light 主题下强行加的选项背景色）

- [ ] **步骤 1：重写 index.css 的极简刷题基础选项样式**
  替换原本的 `MINIMALIST QUIZ STYLES`。
  
  ```css
  /* ========== MINIMALIST QUIZ STYLES (Zen Mode) ========== */
  .quiz-question-block {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin-top: 1.5rem !important;
    margin-bottom: 40px !important; /* 加大题目之间呼吸留白 */
  }

  .quiz-question-text {
    font-size: 18px !important;
    font-weight: 550 !important;
    line-height: 1.75 !important;
    color: var(--text-strong) !important;
  }

  .quiz-option-item {
    background: transparent !important;
    border: none !important;
    border-left: 2px solid transparent !important; /* 隐藏但保留宽度，防抖动 */
    border-radius: 0 !important;
    padding: 12px 16px !important; /* 舒适的做题点击尺寸 */
    margin-bottom: 10px !important;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  /* 鼠标悬停时的流光呼吸背景微光 */
  .quiz-option-item:hover {
    border-left-color: transparent !important;
    background: rgba(255, 255, 255, 0.025) !important;
    border-radius: 8px !important; /* 渐显 8px 圆角 */
    transform: translateX(4px) !important;
  }
  :root[data-theme="light"] .quiz-option-item:hover {
    background: rgba(59, 130, 246, 0.04) !important;
  }

  /* 已选未提交状态 */
  .quiz-option-item.selected {
    border-left-color: var(--accent) !important;
    background: transparent !important;
    color: var(--accent) !important;
    font-weight: 550 !important;
    transform: none !important;
  }

  /* 答对状态 */
  .quiz-option-item.correct {
    border-left-color: var(--success) !important;
    background: transparent !important;
    color: var(--success) !important;
    font-weight: 550 !important;
  }

  /* 答错状态 */
  .quiz-option-item.wrong {
    border-left-color: var(--danger) !important;
    background: transparent !important;
    color: var(--danger) !important;
    font-weight: 550;
  }
  ```

- [ ] **步骤 2：重写 Light 主题下强行覆盖的选项卡片背景**
  清空亮色模式下覆盖的 `.quiz-option-item` 显眼填充色，改用无界透明设计。
  
  ```css
  /* 覆盖 Light 主题选项背景 */
  :root[data-theme="light"] [data-element="option"][data-state="unselected"] {
    background-color: transparent !important;
    border-color: transparent !important;
    color: var(--text);
  }
  :root[data-theme="light"] [data-element="option"][data-state="selected"] {
    background-color: transparent !important;
    border-color: transparent !important;
    color: var(--accent);
  }
  :root[data-theme="light"] [data-element="option"][data-state="correct"] {
    background-color: transparent !important;
    border-color: transparent !important;
    color: var(--success);
  }
  :root[data-theme="light"] [data-element="option"][data-state="wrong"] {
    background-color: transparent !important;
    border-color: transparent !important;
    color: var(--danger);
  }
  ```

- [ ] **步骤 3：重构 Immersive Dots 轨道与滑出面板的 CSS 样式**
  使轨道处于深度隐藏状态，并增强滑出面板的玻璃模糊度和精致光感。
  
  ```css
  /* 沉浸模式侧边点阵导航优化 */
  .immersive-dots-track {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 8px;
    background: rgba(15, 17, 23, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-right: none;
    border-radius: 14px 0 0 14px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    pointer-events: auto;
    opacity: 0.15; /* 深度隐形轨道 */
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: -4px 4px 20px rgba(0, 0, 0, 0.2);
  }

  .immersive-dots-nav-container:hover .immersive-dots-track {
    opacity: 1; /* 鼠标接近时提亮 */
  }

  .immersive-dot.unanswered {
    background: rgba(255, 255, 255, 0.08) !important; /* 超低饱和度点 */
  }
  :root[data-theme="light"] .immersive-dot.unanswered {
    background: #cbd5e1 !important;
  }

  /* 极致高级滑出面板 */
  .immersive-hover-card-panel {
    position: absolute;
    right: -240px;
    top: 0;
    bottom: 0;
    width: 220px;
    background: rgba(15, 17, 23, 0.75) !important;
    backdrop-filter: blur(30px); /* 深度毛玻璃 */
    -webkit-backdrop-filter: blur(30px);
    border-left: 1px solid rgba(255, 255, 255, 0.05); /* 极细描边 */
    pointer-events: auto;
    transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: -10px 0 35px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
  }
  ```

---

### 任务 2：更新 QuestionBlock 选项与题型 Badge 样式 (QuestionBlock.jsx)

**文件：**
- 修改：`学习系统/src/components/QuestionBlock.jsx`

- [ ] **步骤 1：调整题型 Badge 样式**
  去掉题型 Badge 实色，改为低权重透明度极细框。
  
  ```jsx
  // 修改 QuestionBlock.jsx：将 typeLabel 附近的结构精简为仅保留低对比度文字或细圈虚线
  ```

- [ ] **步骤 2：对齐选项项 CSS 类名**
  确保生成的 `optionClass` 完美契合无边界极简定义：即默认只带 `.quiz-option-item` 且在状态激活时触发相应的 `.selected`、`.correct`、`.wrong` 类。

---

### 任务 3：更新 QuizPage 辅助元素 (QuizPage.jsx)

**文件：**
- 修改：`学习系统/src/pages/QuizPage.jsx`

- [ ] **步骤 1：精简顶部进度线**
  将顶部定位进度线修改为高度 `1.5px`，去掉艳丽渐变，使用单一的高亮色 `bg-primary`，并加入轻度透明的 `opacity-70` 类。

- [ ] **步骤 2：对快捷键提示文本与控制按钮降噪**
  * 将下方快捷键文字 `[ A-D / 1-4 ] 选择` 的容器加上 `opacity-35 hover:opacity-70 transition-opacity` 的淡化处理。
  * 将未答完时的“还需回答 X 题”按钮，设计为无填充、极细虚线描边的幽灵样式（在 `index.css` 或内联样式中加入 `border-dashed` 且不加高亮背景）。

---

### 任务 4：更新 AnswerCard 的面板滑出动画 (AnswerCard.jsx)

**文件：**
- 修改：`学习系统/src/components/AnswerCard.jsx`

- [ ] **步骤 1：微调沉浸式轨道与小圆点类名**
  更新小圆点对应背景渲染（特别是未做题的点，对接 `.unanswered` 降噪类）。

---

### 任务 5：全面运行验证与验收

- [ ] **步骤 1：本地编译与静态构建验证**
  运行：`npm run build` 验证项目能够正常构建通过。
  预期：没有打包错误，一切顺利。

- [ ] **步骤 2：本地开发测试**
  运行：`npm run dev` 启动服务并进入刷题界面。
  预期：界面显现出高级极简禅模式，无明显色块，呼吸间距舒适，微交互动画柔和，右侧圆点静默隐去，鼠标悬停时才滑出毛玻璃面板。

---
