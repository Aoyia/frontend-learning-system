import vue3ReactivityMarkdown from '../日常工作学习过程中的看过的文档/vue3响应式原理.md?raw';

export const WORK_NOTES_CONTENT = {
  id: 'work-notes',
  name: '日常工作学习文档',
  icon: '📝',
  desc: '沉淀日常工作中的技术专题，支持在学习系统中统一阅读。',
  docs: [
    {
      title: 'Vue 3响应式原理源码解析',
      difficulty: '困难',
      sourceCards: ['Vue 3 响应式系统源码'],
      content: vue3ReactivityMarkdown,
      quiz: [],
    },
  ],
};
