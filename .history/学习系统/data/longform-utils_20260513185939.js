function list(items) {
  return items.map(item => `- ${item}`).join('\n');
}

function refList(items) {
  return items.map(item =>
    typeof item === 'string'
      ? `- ${item}`
      : `- [${item.title}](${item.url})${item.desc ? `  — ${item.desc}` : ''}`
  ).join('\n');
}

function keywordList(items) {
  return items.map(item => `- **${item.term}**：${item.desc}`).join('\n');
}

export function makeLongformDoc({
  title,
  difficulty = '困难',
  sourceCards,
  problem,
  customerCase,
  flow,
  keywords,
  interview,
  demo,
  diagnosis,
  followups,
  deepDive,
  references,
  quiz,
}) {
  return {
    title,
    difficulty,
    sourceCards,
    content: `
# ${title}

## 1. 它解决什么问题？

${problem}

## 2. 真实客户问题

${customerCase}

## 3. 核心流程

${list(flow)}

## 4. 关键词清单

${keywordList(keywords)}

## 5. 一句面试版

==${interview}==

## 6. 最小 demo / 最小案例

${demo}

## 7. 常见问题怎么定位？

${list(diagnosis)}

## 8. 大厂面试追问

${list(followups)}

## 9. 是否值得深入？

${deepDive}

## 10. 参考资料

${list(references)}
`.trim(),
    quiz,
  };
}

export function single(question, options, answer, explain) {
  return { type: 'single', question, options, answer, explain };
}

export function multiple(question, options, answer, explain) {
  return { type: 'multiple', question, options, answer, explain };
}

export function judgment(question, answer, explain) {
  return { type: 'judgment', question, options: ['对', '错'], answer, explain };
}
