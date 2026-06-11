# 目录锚点导航与 URL Hash 同步实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标**：在用户点击目录项时，浏览器地址栏中自动拼接 Hash 锚点；在页面首次加载或带 Hash 路由进入时，页面自动平滑滚动定位到对应的标题 DOM 节点。

**架构**：以 React Router 的 `useLocation().hash` 作为单数据源，点击 `ArticleToc` 目录项只通过 `navigate` 改变 URL 的 hash。而在父组件 `Article.jsx` 与 `TechBreakerCard.jsx` 中监听该 hash 的变化，并在组件加载/内容渲染后，使用 `scrollIntoView({ behavior: 'smooth' })` 统一执行平滑滚动定位。

**技术栈**：React, React Router DOM (v6)

---

### 任务 1：重构 `ArticleToc.jsx` 支持路由 Hash 导航

**文件：**
- 修改：[ArticleToc.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/components/ArticleToc.jsx)

- [ ] **步骤 1：引入 `useNavigate` 并重写目录点击处理**
在 `ArticleToc.jsx` 中导入 `useNavigate`。删除直接的 `scrollIntoView` 操作，点击目录项改用更新路由 Hash：
```diff
-import React, { useEffect, useRef, useState } from 'react';
+import React, { useEffect, useRef, useState } from 'react';
 import { Tooltip } from '@arco-design/web-react';
+import { useNavigate } from 'react-router-dom';
 import '@arco-design/web-react/es/style/index.css';
 import '@arco-design/web-react/es/Tooltip/style/index.css';
 
 export function ArticleToc({ items, className = '' }) {
   const [activeId, setActiveId] = useState(items[0]?.id || '');
   const [isScrolling, setIsScrolling] = useState(false);
   const scrollTimerRef = useRef(null);
   const itemKey = items.map(item => item.id).join('|');
+  const navigate = useNavigate();
 
   useEffect(() => {
     setActiveId(items[0]?.id || '');
   }, [itemKey, items]);
...
   if (!items.length) return null;
 
   function scrollToHeading(id) {
-    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
+    navigate({ hash: `#${id}` });
   }
```

- [ ] **步骤 2：测试构建验证**
在项目根目录运行编译命令：
```bash
pnpm build
```
预期输出：打包正常通过，无编译/打包语法错误。

- [ ] **步骤 3：Git Commit 暂存**
```bash
git add 学习系统/src/components/ArticleToc.jsx
git commit -m "feat(toc): 重构目录点击为触发路由 Hash 改变，不直接滚动 DOM"
```

---

### 任务 2：重构 `Article.jsx` 以监听 Hash 变动执行定位

**文件：**
- 修改：[Article.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/Article.jsx)

- [ ] **步骤 1：引入 `useLocation` 并添加 `useEffect` 统一做定位滚动**
在 `Article.jsx` 导入部分引入 `useLocation`，并在组件内部使用 `useEffect` 监听 `location.hash` 和文章数据 `articleData`。
代码变化：
```diff
-import React, { useEffect, useState, useTransition } from 'react';
-import { useParams } from 'react-router-dom';
+import React, { useEffect, useState, useTransition } from 'react';
+import { useParams, useLocation } from 'react-router-dom';
 import { getArticleDetail } from '../utils/docs.js';
 import { renderMarkdownWithHeadings } from '../utils/markdown.js';
 import { ArticleToc } from '../components/ArticleToc.jsx';
```
在组件内部定义监听：
```javascript
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    // 延迟 150ms 确保 markdown DOM 已完全渲染渲染并挂载
    const timer = setTimeout(() => {
      try {
        const id = decodeURIComponent(location.hash.slice(1));
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (e) {
        console.error('Failed to scroll to hash anchor:', e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location.hash, articleData]); // 监听 hash 与文章内容数据变化
```

- [ ] **步骤 2：测试构建验证**
在项目根目录运行编译命令：
```bash
pnpm build
```
预期输出：构建成功。

- [ ] **步骤 3：Git Commit 暂存**
```bash
git add 学习系统/src/pages/Article.jsx
git commit -m "feat(article): 监听 location.hash 并平滑滚动定位到对应的 Markdown 标题"
```

---

### 任务 3：重构 `TechBreakerCard.jsx` 支持相同定位行为

**文件：**
- 修改：[TechBreakerCard.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/TechBreakerCard.jsx)

- [ ] **步骤 1：引入 `useLocation` 并使用 `useEffect` 监听定位**
对 `TechBreakerCard.jsx` 进行同样的改动，支持在破冰卡片页面的平滑滚动。
代码变化：
```diff
-import React, { useMemo } from 'react';
+import React, { useMemo, useEffect } from 'react';
+import { useLocation } from 'react-router-dom';
 import { renderMarkdownWithHeadings } from '../utils/markdown.js';
 import { getDifficultyClass } from '../utils/quiz.js';
 import { getBreakerCard } from '../utils/techBreaker.js';
```
in component:
```javascript
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const timer = setTimeout(() => {
      try {
        const id = decodeURIComponent(location.hash.slice(1));
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (e) {
        console.error('Failed to scroll to breaker card hash anchor:', e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location.hash, rendered.html]);
```

- [ ] **步骤 2：编译构建验证**
在项目根目录运行：
```bash
pnpm build
```
预期输出：打包编译完成无报错。

- [ ] **步骤 3：Git Commit 暂存**
```bash
git add 学习系统/src/pages/TechBreakerCard.jsx
git commit -m "feat(breaker-card): 在破冰卡片页监听 location.hash 并定位"
```
