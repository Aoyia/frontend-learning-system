export function normalizeMarkdown(content) {
  return content
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .replace(/==([\s\S]*?)==/g, '<mark>$1</mark>')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

export function getDifficultyClass(difficulty) {
  if (difficulty === '入门') return 'easy';
  if (difficulty === '进阶') return 'medium';
  return 'hard';
}

export function sourceTypeLabel(type) {
  if (type === 'blog') return '博客';
  if (type === 'note') return '笔记';
  if (type === 'official') return '官方资料';
  if (type === 'original') return '原创';
  return type;
}

export function formatAnswer(question, answer) {
  const toText = idx => {
    if (idx === undefined || idx === null) return '未选择';
    if (question.type === 'judgment') return question.options[idx] || '未选择';
    return `${'ABCDEF'[idx]}. ${question.options[idx] || ''}`;
  };
  return Array.isArray(answer) ? answer.map(toText).join('；') : toText(answer);
}
