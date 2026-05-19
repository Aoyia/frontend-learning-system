# Project Guide

## Key Paths

- `技术破冰/index.md`: knowledge-card index and learning order.
- `技术破冰/技术破冰.canvas`: visual knowledge map. Edit as JSON; preserve existing node/edge style.
- `技术破冰/cards/*.md`: concise破冰 cards.
- `学习系统/data/learning-content.js`: only app content aggregation entry.
- `学习系统/data/*-content.js`: semantic deep-learning modules.
- `学习系统/docs/**/*.md`: Markdown document library for curated docs.
- `学习系统/docs/博客文档/<中文模块>/*.md`: primary location for user-provided blogs, notes, and focused topic articles.
- `学习系统/日常工作学习过程中的看过的文档/*.md`: raw archive only; do not use as the long-term app entry.
- `学习系统/data/docs-loader.js`: auto-loads Markdown docs into specialty modules; ordinary docs do not need manual imports.
- `学习系统/data/longform-utils.js`: helpers for `makeLongformDoc`, `single`, `multiple`, `judgment`.
- `学习系统/src/App.jsx`: rendering, routes, IndexedDB, quiz, wrong book.

## 技术破冰 Card Pattern

Use this only for broad map-level concepts.

```md
---
title: Topic
category: 前端工程化
tags:
  - frontend
difficulty: medium
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Topic

## 1. 它属于哪个知识板块？

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？
### 2.2 核心流程
### 2.3 关键词清单
### 2.4 一句面试版
### 2.5 最小 demo / 最小案例
### 2.6 是否值得深入？

## 3. 选择题自测
```

Keep external links out of card bodies; mention official resource names only.

## Deep Longform Pattern

Use semantic files, not batch-number files. Export one module object:

```js
import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const TOPIC_CONTENT = {
  id: 'stable-semantic-id',
  name: '深度长文：Topic',
  icon: '...',
  desc: '...',
  sourceCards: ['技术破冰卡片名'],
  docs: [
    makeLongformDoc({
      title: '...',
      sourceCards: ['...'],
      problem: '...',
      customerCase: '...',
      flow: ['...'],
      keywords: [{ term: '...', desc: '...' }],
      interview: '...',
      demo: `...`,
      diagnosis: ['...'],
      followups: ['...'],
      deepDive: '...',
      references: ['官方资料名称'],
      quiz: [
        single('question', ['A', 'B', 'C', 'D'], 0, 'explain'),
        multiple('question', ['A', 'B', 'C', 'D'], [0, 2], 'explain'),
        judgment('question', 1, 'explain')
      ],
    }),
  ],
};
```

Then import it in `learning-content.js` and append it to `LONGFORM_MODULES`.

## Markdown Blog Doc Pattern

Use this for user-pasted blogs, technical notes, or focused topic articles that should be visible in the project without creating a new JS module.

```md
---
title: Vue 3 provide / inject 原理：provides 原型链与依赖注入
module: vue
difficulty: 困难
tags: [vue, provide-inject, source-code]
sourceType: blog
sourceTitle: 原博客或原笔记标题
sourceUrl:
sourceAuthor:
originalPath:
order: 4
created: 2026-05-18
updated: 2026-05-18
---

# Title

## 1. 它解决什么问题？
## 2. 核心流程
## 3. 核心源码与数据结构
## 4. 最小 demo / 最小案例
## 5. 常见问题怎么定位？
## 6. 面试版回答
## 7. 推荐阅读
## 8. 作业

## 📝 面试题自测

### Q1 [single]
Question
A. Option
B. Option
答案：A
解析：Explanation
```

Supported `module` keys in `docs-loader.js`: `vue`, `engineering`, `performance`, `project-prep`, `scenarios`. Add a module config before using a new key. Chinese folder names are for human navigation; `module` is the stable app routing key.

When converting a blog:

- Preserve the core argument and useful structure, but normalize Markdown headings, code fences, and tables.
- Verify framework/tool behavior with official docs and GitHub source before writing durable claims.
- Add a `推荐阅读` section with official docs/source links when available.
- Add homework that asks the learner to reproduce, debug, or explain the topic.
- Add at least 6 targeted quiz questions under `## 📝 面试题自测`.

## Direct Blog Paste Checklist

Use this checklist when the user directly pastes a blog/article/Markdown note/long technical answer.

1. Decide whether the user explicitly requested "only answer/explain". If not, treat the paste as a request to add a Markdown blog document.
2. Classify the module:
   - Vue/core/framework mechanism -> `module: vue`, folder `Vue`
   - tooling/build/release/CI/packages -> `module: engineering`, folder `工程化`
   - Web Vitals/render/network/memory -> `module: performance`, folder `性能优化`
   - project interview prep/personal project deep-dive/interview answer packs -> `module: project-prep`, folder `项目准备`
   - interview scenario/system design/handwritten task -> `module: scenarios`, folder `场景题`
3. Search before writing:
   - `rg -n "<topic keywords>" 学习系统/docs/博客文档 学习系统/docs`
   - If a near-duplicate exists, update that file instead of creating a parallel document.
4. Create or update `学习系统/docs/博客文档/<中文模块>/<中文标题>.md`.
   - Use a concise Chinese filename.
   - Keep `sourceUrl` and `sourceAuthor` blank if the user did not provide them.
   - For pasted content, set `sourceType: blog`; set `sourceTitle` to the blog title or a concise inferred title.
5. Preserve the blog's useful main structure, but normalize:
   - heading levels
   - fenced code blocks and language tags
   - tables
   - Mermaid blocks
   - Obsidian highlights `==重点==` and internal links `[[...]]`
6. Calibrate important claims with official docs, GitHub source, or official repositories. Add official links to `推荐阅读`.
7. Add learning-loop content:
   - `## 作业` with reproduction/debug/explanation tasks
   - `## 📝 面试题自测` with at least 6 questions
   - explanations focused on judgment standards, diagnosis paths, and tradeoffs
8. Do not add JS content files for pasted blogs unless the user explicitly requests a new semantic longform module.
9. Verify:
   - Run `npm run build` in `学习系统` when app content changed.
   - Browser-smoke the target module, target doc, quiz start, answer card, and wrong-book path when quiz behavior/content changed.

## Quiz Rules

- At least 6 quiz questions per deep doc.
- Write and display questions in the traditional exam order: single-choice first, multiple-choice second, judgment last. Do not alternate question types.
- Prefer judgment, tradeoff, diagnosis path, and engineering decision questions.
- Use `single` for one correct option, `multiple` for multiple correct options, `judgment` where `0` means 对 and `1` means 错.
- Every question needs a specific explanation.

## Verification

Run from `学习系统`:

```bash
npm run build
```

Browser-smoke with the existing Playwright pattern:

- Homepage expected module count and names.
- Target module opens and shows required longform sections.
- Quiz starts and answer card is visible.
- If quiz/wrong-book behavior changes, intentionally answer wrong, confirm wrong book entry, and recommended reading jump.
