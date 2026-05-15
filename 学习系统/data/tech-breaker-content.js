const CARD_MARKDOWN = import.meta.glob('../../技术破冰/cards/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const CARD_GROUPS = [
  {
    id: 'tech-breaker-engineering-main',
    name: '技术破冰：工程化主干',
    icon: '🧭',
    desc: '按照技术破冰格式学习包管理、开发服务器、构建工具、Vite 和内部库发布。',
    cards: ['前端工程化', '包管理器', '开发服务器', '构建工具', 'Vite', '内部 NPM 包与库模式构建'],
  },
  {
    id: 'tech-breaker-performance',
    name: '技术破冰：性能优化',
    icon: '⚡',
    desc: '按指标、工具、原理、排查路径系统学习 LCP、INP、CLS 和性能预算。',
    cards: [
      '前端性能优化',
      '性能指标与度量',
      'LCP 与首屏加载',
      'INP 与交互响应',
      'Long Task 与主线程让出',
      'CLS 与视觉稳定',
      '资源加载与缓存策略',
      '渲染流程与渲染性能',
      '性能监控与性能预算',
      'Chrome Memory 与 Performance Monitor',
    ],
  },
  {
    id: 'tech-breaker-advanced',
    name: '技术破冰：前端进阶',
    icon: '🧠',
    desc: '围绕 TypeScript、Monorepo、微前端和组件库设计建立中高级前端能力。',
    cards: ['TypeScript 进阶', 'Monorepo 工程', '微前端', '组件库设计'],
  },
  {
    id: 'tech-breaker-delivery-backend',
    name: '技术破冰：交付与后端基础',
    icon: '🚢',
    desc: '补齐 CI/CD、DevOps、容器、接口、Node 和数据库等客户问题定位基础。',
    cards: [
      'CI-CD',
      '发布策略',
      'DevOps',
      'Jenkins',
      '请求-响应全链路',
      'REST 与接口设计',
      'Node 最小 HTTP 服务',
      '关系型数据库与 SQL',
      'Docker 与容器化',
      'K8s 与容器编排',
    ],
  },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function readCard(title) {
  return CARD_MARKDOWN[`../../技术破冰/cards/${title}.md`];
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) meta[key] = value;
  });
  return meta;
}

function difficultyLabel(value) {
  if (value === 'hard') return '困难';
  if (value === 'medium') return '进阶';
  return value || '进阶';
}

function parseQuiz(markdown) {
  const questionBlocks = markdown.split(/\n### Q\d+\s*\n/).slice(1);

  return questionBlocks
    .map(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      const question = lines.find(line => !/^[A-F]\./.test(line) && !line.startsWith('答案：') && !line.startsWith('解析：'));
      const options = lines
        .filter(line => /^[A-F]\./.test(line))
        .map(line => line.replace(/^[A-F]\.\s*/, ''));
      const answerLine = lines.find(line => line.startsWith('答案：'));
      const explainLine = lines.find(line => line.startsWith('解析：'));
      const answerLetter = answerLine?.replace('答案：', '').trim();
      const answer = LETTERS.indexOf(answerLetter);

      if (!question || options.length < 2 || answer < 0) return null;

      return {
        type: 'single',
        question,
        options,
        answer,
        explain: explainLine ? explainLine.replace('解析：', '').trim() : '请回到本文对应章节复习关键概念。',
      };
    })
    .filter(Boolean);
}

function stripQuizSection(markdown) {
  return markdown.replace(/\n## \d+\. 选择题自测[\s\S]*$/m, '').trim();
}

function makeDoc(title) {
  const markdown = readCard(title);
  if (!markdown) {
    return {
      title,
      difficulty: '进阶',
      content: `# ${title}\n\n这张技术破冰卡片暂未找到，请检查 技术破冰/cards 目录。`,
      quiz: [],
    };
  }

  const meta = parseFrontmatter(markdown);
  return {
    title: meta.title || title,
    difficulty: difficultyLabel(meta.difficulty),
    content: stripQuizSection(markdown),
    quiz: parseQuiz(markdown),
  };
}

export const TECH_BREAKER_MODULES = CARD_GROUPS.map(group => ({
  id: group.id,
  name: group.name,
  icon: group.icon,
  desc: group.desc,
  docs: group.cards.map(makeDoc),
}));
