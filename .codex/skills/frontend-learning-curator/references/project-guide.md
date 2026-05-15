# Project Guide

## Key Paths

- `技术破冰/index.md`: knowledge-card index and learning order.
- `技术破冰/技术破冰.canvas`: visual knowledge map. Edit as JSON; preserve existing node/edge style.
- `技术破冰/cards/*.md`: concise破冰 cards.
- `学习系统/data/learning-content.js`: only app content aggregation entry.
- `学习系统/data/*-content.js`: semantic deep-learning modules.
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

## Quiz Rules

- At least 6 quiz questions per deep doc.
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
