import { TECH_BREAKER_CONTENT } from '../../data/tech-breaker-content.js';
import { orderQuestionsByType } from './quiz.js';

export const TECH_BREAKER_LAYOUT_KEY = 'tech-breaker-canvas-layout:v1';

export function getBreakerCard(nodeId) {
  const title = TECH_BREAKER_CONTENT.nodeToCard[nodeId];
  if (!title) return null;
  const node = TECH_BREAKER_CONTENT.nodesById[nodeId];
  const card = TECH_BREAKER_CONTENT.cardsByTitle[title];
  return card ? { ...card, node, nodeId } : null;
}

export function getBreakerQuestions(nodeId) {
  const card = getBreakerCard(nodeId);
  if (!card) return [];
  return orderQuestionsByType((card.quiz || []).map((question, quizIdx) => ({
    ...question,
    _qid: `breaker__${nodeId}__${quizIdx}`,
    _breakerNodeId: nodeId,
    _cardTitle: card.title,
    _quizIdx: quizIdx,
  })));
}

export function getCanvasNodeTitle(node) {
  if (node.type === 'file') {
    const cardTitle = TECH_BREAKER_CONTENT.nodeToCard[node.id];
    if (cardTitle) return cardTitle;
    return node.file?.split('/').pop()?.replace(/\.md$/, '') || '未命名卡片';
  }
  const firstLine = (node.text || '').split('\n').find(Boolean) || '说明';
  return firstLine.replace(/^#+\s*/, '');
}

export function getCanvasNodeSummary(node) {
  if (node.type !== 'text') return '';
  const title = getCanvasNodeTitle(node);
  return (node.text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => line.replace(/^#+\s*/, '') !== title)
    .slice(0, 5)
    .join('\n');
}

export function getCanvasBounds(nodes) {
  if (!nodes.length) return { minX: 0, minY: 0, maxX: 1000, maxY: 700, width: 1000, height: 700 };
  const minX = Math.min(...nodes.map(node => node.x));
  const minY = Math.min(...nodes.map(node => node.y));
  const maxX = Math.max(...nodes.map(node => node.x + node.width));
  const maxY = Math.max(...nodes.map(node => node.y + node.height));
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function getEdgePoint(node, side) {
  if (!node) return { x: 0, y: 0 };
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  if (side === 'left') return { x: node.x, y: centerY };
  if (side === 'right') return { x: node.x + node.width, y: centerY };
  if (side === 'top') return { x: centerX, y: node.y };
  if (side === 'bottom') return { x: centerX, y: node.y + node.height };
  return { x: centerX, y: centerY };
}

export function readSavedCanvasLayout() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(TECH_BREAKER_LAYOUT_KEY) || 'null');
  } catch {
    return null;
  }
}

export function mergeCanvasNodesWithSavedLayout(nodes, saved) {
  const savedNodes = saved?.nodes || {};
  return nodes.map(node => ({
    ...node,
    ...(savedNodes[node.id] || {}),
  }));
}
