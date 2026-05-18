/**
 * docs-loader.js
 * 通用 Obsidian 兼容 Markdown 文档加载器。
 *
 * 文件格式约定（兼容 Obsidian）：
 * ---
 * title: 文档标题
 * difficulty: 困难 | 进阶 | 入门
 * tags: [vue, reactivity]
 * module: vue          ← 决定归属哪个模块（必填）
 * sourceType: blog     ← blog | note | official | original
 * sourceTitle: 原博客或原笔记标题
 * sourceUrl: 原文链接
 * sourceAuthor: 作者
 * order: 1             ← 模块内排序
 * ---
 *
 * # 正文...
 *
 * ## 📝 面试题自测
 *
 * ### Q1 [single]
 * 题目文本
 * A. 选项
 * B. 选项
 * 答案：A
 * 解析：解析文本
 *
 * ### Q2 [multiple]
 * 题目文本
 * A. 选项
 * B. 选项
 * 答案：AB
 * 解析：解析文本
 *
 * ### Q3 [judgment]
 * 判断题文本
 * 答案：对
 * 解析：解析文本
 */

// 正式文档库只扫描 docs/，旧“看过的文档”目录保留为原始备份，不再进入系统入口。
const ALL_DOCS = import.meta.glob('../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// ── 模块元信息 ────────────────────────────────────────────
const MODULE_CONFIGS = {
  vue: {
    id: 'vue-special',
    name: 'Vue 专项模块',
    icon: '🖖',
    desc: 'Vue 3 核心机制专项：响应式原理、Diff、computed、scheduler，高频面试覆盖。',
  },
  engineering: {
    id: 'engineering-special',
    name: '前端工程化专项',
    icon: '🔧',
    desc: '构建工具原理、Tree Shaking、HMR、Monorepo、模块联邦，工程化面试系统复盘。',
  },
  performance: {
    id: 'performance-special',
    name: '性能优化专项',
    icon: '⚡',
    desc: 'Core Web Vitals、渲染性能、包体积优化、网络优化，性能面试系统复盘。',
  },
  scenarios: {
    id: 'scenarios-special',
    name: '高频场景题',
    icon: '🎯',
    desc: '面试高频手写题与场景设计题：防抖、Promise、虚拟列表、权限控制等。',
  },
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── 解析器 ────────────────────────────────────────────────
function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const rawVal = line.slice(idx + 1).trim();
    // 处理行内 YAML 数组 [a, b, c]
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      meta[key] = rawVal.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      meta[key] = rawVal;
    }
  });
  return meta;
}

/**
 * 去掉 frontmatter 和 quiz 节，转换 Obsidian 特有语法为 HTML
 */
function getMainContent(markdown) {
  return markdown
    .replace(/^---\n[\s\S]*?\n---\n?/, '')          // 去 frontmatter
    .replace(/\n## [^\n]*面试题自测[\s\S]*$/m, '')   // 去 quiz 节
    .replace(/==([\s\S]*?)==/g, '<mark>$1</mark>')   // Obsidian 高亮
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')  // Obsidian 别名链接
    .replace(/\[\[([^\]]+)\]\]/g, '$1')              // Obsidian 内部链接
    .trim();
}

/**
 * 解析 ## 面试题自测 节中的题目
 * 支持 [single] [multiple] [judgment]（及中文 [单选] [多选] [判断]）
 */
function parseDocsQuiz(markdown) {
  const quizMatch = markdown.match(/\n## [^\n]*面试题自测([\s\S]*)$/m);
  if (!quizMatch) return [];

  const quizSection = quizMatch[1];

  // 提取所有 Q 块的类型标记
  const headerRegex = /\n### Q\d+(?:\s+\[([^\]]*)\])?\s*\n/g;
  const typeMarkers = [];
  let m;
  while ((m = headerRegex.exec(quizSection)) !== null) {
    typeMarkers.push(m[1] || 'single');
  }

  // 按 Q 块分割
  const blocks = quizSection.split(/\n### Q\d+(?:\s+\[[^\]]*\])?\s*\n/).slice(1);

  return blocks.map((block, i) => {
    const rawType = (typeMarkers[i] || 'single').toLowerCase();
    const type = rawType
      .replace('单选', 'single')
      .replace('多选', 'multiple')
      .replace('判断', 'judgment');

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const answerLine = lines.find(l => l.startsWith('答案：'));
    const explainLine = lines.find(l => l.startsWith('解析：'));
    const answerStr = answerLine?.replace('答案：', '').trim() || '';
    const explain = explainLine?.replace('解析：', '').trim() || '';

    if (type === 'judgment') {
      const question = lines.find(l => !l.startsWith('答案：') && !l.startsWith('解析：'));
      if (!question) return null;
      return {
        type: 'judgment',
        question,
        options: ['对', '错'],
        answer: answerStr === '对' ? 0 : 1,
        explain,
      };
    }

    const question = lines.find(
      l => !/^[A-F]\./.test(l) && !l.startsWith('答案：') && !l.startsWith('解析：')
    );
    const options = lines
      .filter(l => /^[A-F]\./.test(l))
      .map(l => l.replace(/^[A-F]\.\s*/, ''));

    if (!question || options.length < 2) return null;

    if (type === 'multiple') {
      const answer = answerStr
        .split('')
        .map(c => LETTERS.indexOf(c))
        .filter(n => n >= 0);
      if (!answer.length) return null;
      return { type: 'multiple', question, options, answer, explain };
    }

    // single
    const answer = LETTERS.indexOf(answerStr);
    if (answer < 0) return null;
    return { type: 'single', question, options, answer, explain };
  }).filter(Boolean);
}

function difficultyLabel(v) {
  if (!v) return '进阶';
  const lv = v.toLowerCase();
  if (lv === 'hard' || v === '困难') return '困难';
  if (lv === 'medium' || v === '进阶') return '进阶';
  if (lv === 'easy' || v === '入门') return '入门';
  return v;
}

// ── 构建模块列表 ──────────────────────────────────────────
function compactMeta(meta, keys) {
  return Object.fromEntries(
    keys
      .map(key => [key, meta[key]])
      .filter(([, value]) => value !== undefined && value !== '')
  );
}

function buildModulesFromDocs(docsMap) {
  /** @type {Record<string, Array<{meta: object, raw: string}>>} */
  const grouped = {};

  for (const [filePath, raw] of Object.entries(docsMap)) {
    const meta = parseFrontmatter(raw);
    const moduleKey = meta.module;
    if (!moduleKey || !MODULE_CONFIGS[moduleKey]) continue; // 未标注 module 的文件跳过
    if (!grouped[moduleKey]) grouped[moduleKey] = [];
    grouped[moduleKey].push({ filePath, meta, raw });
  }

  return Object.entries(grouped)
    .map(([key, files]) => {
      const config = MODULE_CONFIGS[key];
      const docs = files
        .map(({ filePath, meta, raw }) => ({
          title: meta.title || '未命名文档',
          difficulty: difficultyLabel(meta.difficulty),
          sourceCards: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
          tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
          docMeta: compactMeta(meta, [
            'sourceType',
            'sourceTitle',
            'sourceUrl',
            'sourceAuthor',
            'originalPath',
            'created',
            'updated',
          ]),
          filePath,
          order: Number(meta.order) || 999,
          content: getMainContent(raw),
          quiz: parseDocsQuiz(raw),
        }))
        .sort((a, b) => a.order - b.order);

      return { ...config, docs };
    })
    .sort((a, b) => {
      // 保持固定顺序
      const order = ['vue', 'engineering', 'performance', 'scenarios'];
      return order.indexOf(a.id.replace('-special', '')) - order.indexOf(b.id.replace('-special', ''));
    });
}

export const DOCS_MODULES = buildModulesFromDocs(ALL_DOCS);
