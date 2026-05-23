---
name: frontend-learning-curator
description: Use only in this frontend learning repository when the user asks to learn a frontend knowledge point, asks a technical frontend question that should be captured, directly pastes a blog/article/Markdown note/long technical answer, provides interview/exam questions with or without answers, or asks to expand the learning system. By default, pasted blogs and long technical articles should be normalized into 学习系统/docs/博客文档/中文模块/中文标题.md with source metadata, official-source calibration, homework, quiz, and wrong-book loop coverage unless the user explicitly says to only answer/explain.
---

# Frontend Learning Curator

Use this skill to turn user-provided frontend topics, technical questions, directly pasted blogs/articles, Markdown notes, long technical answers, or question sets into this project's learning loop:

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
   - Put user-provided blogs, article drafts, Markdown notes, and pasted long technical answers in `学习系统/docs/博客文档/<中文模块>/` unless they are broad enough to become a new semantic JS module.
   - Put personal project interview prep, project deep-dive notes, interview answer packs, and company-specific project追问资料 in `学习系统/docs/博客文档/项目准备/` with `module: project-prep`.
   - Convert provided questions into structured quiz items and attach them to the closest learning document.
   - For a short technical question, answer it first; only update project content if the user asks to learn, remember, expand, or add it.
   - For a full blog/article/Markdown paste, assume the user wants it added to the document library unless they explicitly say "只回答", "只解释", "不要入库", or equivalent.

3. **Use source hierarchy**
   - Prefer official docs and GitHub source/repositories for correctness.
   - Use high-quality blogs only as secondary explanation.
   - For current framework/tool behavior, browse official docs or inspect source before writing durable content.

4. **Write content**
   - Keep `技术破冰/cards` as concise破冰 cards, not deep longform.
   - Put curated deep learning modules directly in semantic JS files under `学习系统/data`.
   - Put blog-sourced or note-sourced documents in Markdown files under `学习系统/docs/博客文档/<中文模块>/<中文标题>.md` with frontmatter, normalized headings, references, homework guidance, and `## 面试题自测`.
   - Before creating a pasted-blog document, search `学习系统/docs/博客文档` for the same or highly similar topic. Update the existing document when the topic already exists.
   - Every JS deep doc must include `sourceCards`, a customer problem, diagnosis path, interview answer, references, and at least 6 quiz questions.
   - Every Markdown doc must include a stable `title`, `difficulty`, `tags`, `module`, `order`, at least 6 targeted quiz questions, and enough diagnosis/homework content to support learning -> practice -> correction.
   - Author quiz questions in a fixed traditional exam order: all single-choice questions first, then multiple-choice questions, then judgment questions. Do not interleave question types.

5. **Wire and verify**
   - Add new semantic modules through `学习系统/data/learning-content.js`.
   - Markdown docs are auto-loaded by `学习系统/data/docs-loader.js`; do not add extra imports for ordinary docs.
   - Treat `学习系统/日常工作学习过程中的看过的文档` as a raw archive only. Do not rely on it as a long-term app entry.
   - Preserve stable module/doc order unless intentionally adding at the end.
   - Run `npm run build` in `学习系统`.
   - Browser-smoke homepage, target doc, quiz start, answer card, and wrong-book behavior when quiz content changes.

## Decision Rules

- **技术破冰 node**: broad, foundational, reusable across many modules, and useful as a map landmark. Examples: GraphQL / RPC, Redis, Node BFF, 前端安全.
- **Deep learning doc**: applied, scenario-specific, or belongs under an existing module. Examples: Jenkins + Docker 镜像流水线, CSP nonce 配置, React Query optimistic update.
- **Markdown blog doc**: user pasted a blog/article/note, asks to maintain a document library entry, or wants the article visible in the project. Normalize it into `学习系统/docs/博客文档/<中文模块>/<中文标题>.md`, keep the author's core structure, verify details with official docs/source, add homework and quiz.
- **Quiz-only update**: user provides题目 targeting an existing doc and no new concept is needed.

When unsure, prefer adding a deep learning doc first; promote to 技术破冰 only when it becomes a repeated map-level concept.
