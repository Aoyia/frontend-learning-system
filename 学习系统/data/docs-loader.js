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
 *         project-prep ← 项目面试准备资料
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
  react: {
    id: 'react-special',
    name: 'React 专项模块',
    icon: '⚛️',
    desc: 'React 渲染机制、并发特性、性能优化和复杂状态建模专项。',
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
  'project-prep': {
    id: 'project-prep-special',
    name: '项目面试准备',
    icon: '🧭',
    desc: '项目深挖、技术亮点、证据卡、STAR 表达和腾讯中高级前端追问训练。',
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
      .replace('判断', 'judgment')
      .replace('表达', 'expression')
      .replace('oral', 'expression');

    const explainMatch = block.match(/解析[：:]/);
    const explainIdx = explainMatch ? explainMatch.index : -1;
    const hasExplain = explainIdx !== -1;
    const blockBeforeExplain = hasExplain ? block.slice(0, explainIdx) : block;
    const explain = hasExplain ? block.slice(explainIdx + explainMatch[0].length).trim() : '';

    const lines = blockBeforeExplain.split('\n').map(l => l.trim()).filter(Boolean);

    if (type === 'expression') {
      // 提取适用场景
      let scene = '';
      const sceneMatch = block.match(/>\s*[\*\_]*适用场景[：:]\s*[\*\_]*(.*)/);
      if (sceneMatch) {
        scene = sceneMatch[1].trim();
      }

      // 提取推荐表达结构
      let recommendStructure = '';
      const recMatch = block.match(/(?:\*\*推荐表达结构\*\*|\*\*推荐表达\*\*)[：:]?\s*\n([\s\S]*?)(?=\n\*\*|$)/);
      if (recMatch) {
        recommendStructure = recMatch[1].split('\n').map(l => l.trim().replace(/^>\s?/, '')).join('\n').trim();
      } else {
        const quoteLines = lines.filter(l => l.startsWith('>') && !l.includes('适用场景'));
        recommendStructure = quoteLines.map(l => l.replace(/^>\s?/, '')).join('\n').trim();
      }

      // 提取核心关键词锚点
      let keywords = [];
      const kwMatch = block.match(/(?:\*\*关键词锚点\*\*|\*\*关键词\*\*)[：:]?\s*\n([\s\S]*?)(?=\n\*\*|$)/);
      if (kwMatch) {
        const kwText = kwMatch[1];
        const rawKws = kwText.match(/`([^`]+)`/g);
        if (rawKws) {
          keywords = rawKws.map(w => w.slice(1, -1));
        }
      }

      // 提取大厂追问问题
      let followupQuestion = '';
      const fuMatch = block.match(/(?:\*\*大厂追问\*\*|\*\*深度追问\*\*)[：:]?\s*(.*)/);
      if (fuMatch) {
        followupQuestion = fuMatch[1].trim().replace(/^>\s?/, '');
      }

      // 提取追问解答话术
      let followupAnswer = '';
      const fuaMatch = block.match(/(?:\*\*追问话术\*\*|\*\*追问解答\*\*|\*\*追问推荐表达\*\*)[：:]?\s*\n([\s\S]*?)(?=\n\*\*|$)/);
      if (fuaMatch) {
        followupAnswer = fuaMatch[1].split('\n').map(l => l.trim().replace(/^>\s?/, '')).join('\n').trim();
      }

      // 提取追问核心关键词
      let followupKeywords = [];
      const fukwMatch = block.match(/(?:\*\*追问关键词\*\*|\*\*追问关键词锚点\*\*)[：:]?\s*\n([\s\S]*?)(?=\n\*\*|$)/);
      if (fukwMatch) {
        const fukwText = fukwMatch[1];
        const rawFukws = fukwText.match(/`([^`]+)`/g);
        if (rawFukws) {
          followupKeywords = rawFukws.map(w => w.slice(1, -1));
        }
      }

      // 提取题干 (通常是 block 的第一行)
      const firstLine = lines[0] || '';
      const question = firstLine.replace(/^Q\d+[：:]?\s*/, '').trim();

      return {
        type: 'expression',
        question,
        scene,
        recommendStructure,
        keywords,
        followupQuestion,
        followupAnswer,
        followupKeywords,
        explain: explain || recommendStructure, // 复用 explain 字段防止部分原逻辑报错
      };
    }

    const answerLine = lines.find(l => /^答案[：:]/.test(l));
    const answerStr = answerLine?.replace(/^答案[：:]/, '').trim() || '';
    const questionAndOptions = lines.filter(l => !/^答案[：:]/.test(l));

    if (type === 'judgment') {
      const question = questionAndOptions.join('\n');
      if (!question) return null;
      return {
        type: 'judgment',
        question,
        options: ['对', '错'],
        answer: answerStr === '对' ? 0 : 1,
        explain,
      };
    }

    const firstOptionIdx = questionAndOptions.findIndex(l => /^[A-F]\./.test(l));
    if (firstOptionIdx === -1) return null;

    const questionLines = questionAndOptions.slice(0, firstOptionIdx);
    const optionLines = questionAndOptions.slice(firstOptionIdx);

    const question = questionLines.join('\n');
    const options = [];
    let currentOption = null;
    optionLines.forEach(line => {
      if (/^[A-F]\./.test(line)) {
        if (currentOption) options.push(currentOption);
        currentOption = line.replace(/^[A-F]\.\s*/, '');
      } else if (currentOption) {
        currentOption += `\n${line}`;
      }
    });
    if (currentOption) options.push(currentOption);

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
      const order = ['vue', 'react', 'engineering', 'performance', 'project-prep', 'scenarios'];
      return order.indexOf(a.id.replace('-special', '')) - order.indexOf(b.id.replace('-special', ''));
    });
}

export const DOCS_MODULES = buildModulesFromDocs(ALL_DOCS);
