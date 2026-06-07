# 禅模式极简刷题界面设计规格书

## 1. 目标 (Goal)
重构前端学习系统的刷题页面（`QuizPage`、`QuestionBlock`、`AnswerCard`），实现极致的视觉降噪。移除非必要的边框、多重嵌套背景色和厚重感，优化文字留白与对比度。通过微弱的左侧指示线和文字点亮来传达做题状态，创造如纸张般纯净、专注的“禅模式”刷题体验。

---

## 2. 详细设计规范 (Detailed Design Specifications)

### 2.1 题目选项 (Question Options)
* **无界排版**：去除所有选项容器的外边框、圆角阴影和背景色，呈悬浮无边界排版。
* **呼吸感间距**：内边距微调为 `12px 16px`，选项之间的垂直间距设为 `10px`。
* **状态与交互动画**：
  * **默认态 (Unselected)**：
    * 左边线：`border-left: 2px solid transparent` 占位，防止切换状态时布局抖动。
    * 文字颜色：次要文本色，字重 `400`。
  * **Hover 态**：
    * 背景微光：渐现极淡的品牌色微光底色（亮色下为 `rgba(59, 130, 246, 0.04)`，深色下为 `rgba(255, 255, 255, 0.025)`），配有 `8px` 圆角。
    * 微交互位移：选项内容整体平滑向右移动 `4px`（`transform: translateX(4px)`）。
  * **已选未提交状态 (Selected)**：
    * 左边线点亮：`border-left: 2px solid var(--accent)`。
    * 文字颜色：点亮为品牌主色（`var(--accent)`），字重调整为 `550`。
    * 背景：保持 `transparent`。
  * **已提交 - 正确状态 (Correct)**：
    * 左边线切换：`border-left: 2px solid var(--success)`。
    * 文字颜色：点亮为成功绿（`var(--success)`）。
  * **已提交 - 错误状态 (Wrong)**：
    * 左边线切换：`border-left: 2px solid var(--danger)`。
    * 文字颜色：点亮为警示红（`var(--danger)`）。
* **过渡缓动**：所有视觉切换使用苹果风格高阶缓动：`transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)`。

### 2.2 题干与整体布局 (Question Stem & Layout)
* **字号与行高**：题干字号提升至 `18px`，字重设为 `550`，行高拓宽至 `1.75`，提高文字可读性与美感。
* **段落留白**：
  * 题干与选项列表之间的垂直间距设为 `24px`。
  * 题目容器（`question-block`）底边距扩展为 `40px`，依靠高度留白取代物理分割线。
* **题型 Badge 降噪**：去掉背景填充，改为 `1px` 极细半透明圆角边框，颜色调至次要文本色，使其静默存在。

### 2.3 辅助交互元素 (Helper Interaction Elements)
* **顶部进度线**：高度缩减为 `1.5px`，单色高亮（`var(--accent)`），设置 `0.7` 的半透明度，形成毛玻璃感。
* **键盘提示符**：默认透明度设为 `0.35`。仅当用户按下对应按键时，提示符产生一次微弱的呼吸高亮（`opacity: 0.7`），随后自动隐去。
* **控制按钮**：未答完题时“还需回答 X 题”按钮采用幽灵按钮样式（无背景、极细虚线框）；全部答完后平滑过渡为实色点亮状态。
* **右侧呼吸点导航 (Immersive Dots)**：
  * 默认状态下轨道整体透明度降低为 `0.15`，鼠标靠近时淡入亮起。
  * 未做题小点设为半透明白（`rgba(255,255,255,0.08)`）/ 亮色下为浅灰。对错点降低饱和度。
  * 悬停滑出的面板背景使用 `backdrop-filter: blur(30px)` 的深度毛玻璃，边缘使用 `1px rgba(255,255,255,0.05)` 的极窄亮边。

---

## 3. 拟修改的组件与文件 (Proposed Changes)
* **[MODIFY] index.css** (`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/index.css`)：重构所有与 `.quiz-question-block`、`.quiz-option-item` 和 `.immersive-dots-track` 相关的样式，并优化其在亮暗主题下的表现。
* **[MODIFY] QuestionBlock.jsx** (`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/components/QuestionBlock.jsx`)：更改选项的 data 状态和 class 绑定，对接最新极简 CSS。
* **[MODIFY] QuizPage.jsx** (`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/QuizPage.jsx`)：调整按钮和提示文字的样式定义，优化顶部进度线的结构与渲染参数。
* **[MODIFY] AnswerCard.jsx** (`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/components/AnswerCard.jsx`)：精简小圆点和滑出面板的 CSS Class，增强其呼吸态模糊表现。

---

## 4. 验证计划 (Verification Plan)
* **主题对比测试**：对比亮色与暗色模式下的文本对比度，确保无边框下的文本依然拥有绝佳的可读性。
* **交互动效验证**：手动测试 Hover 时 `translateX` 的位移动效，以及选中后左侧线条滑入与加粗的缓动过程。
* **响应式适配测试**：在 iPad 和移动端下验证页面布局是否因为间距变大而发生溢出，确保幽灵按钮在各端上点击正常。
