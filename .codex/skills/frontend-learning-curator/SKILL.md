---
name: frontend-learning-curator
description: Use only in this frontend learning repository when the user asks to learn a frontend knowledge point, asks a technical frontend question that should be captured, provides interview/exam questions with or without answers, or asks to expand the learning system. Classify whether the topic belongs in 技术破冰 canvas/cards as a broad foundation node or in 学习系统/data as a deep learning document with homework, quiz, and wrong-book loop.
---

# Frontend Learning Curator

Use this skill to turn user-provided frontend topics, technical questions, or question sets into this project's learning loop:

```txt
技术破冰导读
→ 深度学习长文
→ 随堂作业 / 模块刷题
→ 错题本
→ 推荐阅读回跳
```

Read `references/project-guide.md` before editing content.

## Workflow

1. **Inspect first**
   - Read `技术破冰/index.md`, `技术破冰/技术破冰.canvas`, and `学习系统/data/learning-content.js`.
   - Search existing cards and semantic content files with `rg` before creating anything.

2. **Classify the input**
   - Put broad foundation topics in `技术破冰` when they can become a map node with multiple downstream concepts.
   - Put narrower or applied topics in `学习系统/data` under the nearest semantic deep-learning module.
   - Convert provided questions into structured quiz items and attach them to the closest learning document.
   - For a technical question, answer it first; only update project content if the user asks to learn, remember, expand, or add it.

3. **Use source hierarchy**
   - Prefer official docs and GitHub source/repositories for correctness.
   - Use high-quality blogs only as secondary explanation.
   - For current framework/tool behavior, browse official docs or inspect source before writing durable content.

4. **Write content**
   - Keep `技术破冰/cards` as concise破冰 cards, not deep longform.
   - Put deep learning content directly in semantic JS files under `学习系统/data`.
   - Every deep doc must include `sourceCards`, a customer problem, diagnosis path, interview answer, references, and at least 6 quiz questions.

5. **Wire and verify**
   - Add new semantic modules through `学习系统/data/learning-content.js`.
   - Preserve stable module/doc order unless intentionally adding at the end.
   - Run `npm run build` in `学习系统`.
   - Browser-smoke homepage, target doc, quiz start, answer card, and wrong-book behavior when quiz content changes.

## Decision Rules

- **技术破冰 node**: broad, foundational, reusable across many modules, and useful as a map landmark. Examples: GraphQL / RPC, Redis, Node BFF, 前端安全.
- **Deep learning doc**: applied, scenario-specific, or belongs under an existing module. Examples: Jenkins + Docker 镜像流水线, CSP nonce 配置, React Query optimistic update.
- **Quiz-only update**: user provides题目 targeting an existing doc and no new concept is needed.

When unsure, prefer adding a deep learning doc first; promote to 技术破冰 only when it becomes a repeated map-level concept.
