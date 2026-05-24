import fs from 'fs';
import path from 'path';

const baseDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/docs/';

const filesToRefactor = [
  {
    path: path.join(baseDir, '博客文档/React/React 并发渲染与性能取舍.md'),
    replacements: [
      {
        old: `### Q6 [multiple]\n在 React 18 渲染性能与并发更新场景中，\`memo\` 失效或收益不明显的常见原因包括？\nA. 子组件每次收到新的对象或函数引用\nB. Context 值变化导致子树更新\nC. 组件本身计算很轻，缓存成本抵消收益\nD. 浏览器不支持 HTML\n答案：ABC`,
        new: `### Q6 [multiple]\n在 React 18 渲染性能与并发更新场景中，\`memo\` 失效或收益不明显的常见原因包括？\nA. 子组件每次收到新的对象或函数引用\nB. Context 值变化导致子树更新\nC. 组件本身计算很轻，缓存成本抵消收益\nD. 父组件渲染时使用了默认的 concurrent mode 异步机制\n答案：ABC`
      }
    ]
  },
  {
    path: path.join(baseDir, '博客文档/Vue/Vue 3 Diff 算法整体流程.md'),
    replacements: [
      {
        old: `### Q4 [single]\n在 Vue 3 子节点双端 Diff 算法的 'patchKeyedChildren' 阶段中，先做"前置扫描 + 后置扫描"的主要目的是什么？\nA. 为了生成 source map\nB. 快速跳过头尾稳定区，缩小中间复杂 diff 范围\nC. 为了兼容 IE11\nD. 为了让 key 失效\n答案：B`,
        new: `### Q4 [single]\n在 Vue 3 子节点双端 Diff 算法的 'patchKeyedChildren' 阶段中，先做"前置扫描 + 后置扫描"的主要目的是什么？\nA. 为了生成 source map\nB. 快速跳过头尾稳定区，缩小中间复杂 diff 范围\nC. 强制将所有子节点转化为 Block 动态节点以提升二次 Diff 渲染速度\nD. 避免在列表包含重复 key 时触发浏览器的重排限制\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '博客文档/Vue/Vue 3 effect 触发次数与调度器.md'),
    replacements: [
      {
        old: `### Q6 [single]\n在 queueJob 的手写实现中，队列使用 'Set' 而不是 'Array' 的原因是？\nA. Set 的 forEach 更快\nB. Set 自动对相同引用的 job 去重，确保同一轮同步中同一个 job 只执行一次\nC. Array 不能存放函数\nD. Set 支持异步迭代\n答案：B`,
        new: `### Q6 [single]\n在 queueJob 的手写实现中，队列使用 'Set' 而不是 'Array' 的原因是？\nA. Set 的 forEach 更快\nB. Set 自动对相同引用的 job 去重，确保同一轮同步中同一个 job 只执行一次\nC. Array 的 indexOf 在多任务高频检索时的 O(n) 开销会阻塞微任务执行\nD. Set 可以在底层利用 C++ 级别的硬件缓存优化迭代性能\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'vue/vue3-provide-inject.md'),
    replacements: [
      {
        old: `### Q3 [single]\n在 Vue 3 中，某组件第一次调用 \`provide\` 时，Vue 为什么要执行 \`Object.create(parentProvides)\`？\nA. 为了深拷贝父组件提供的所有值\nB. 为了创建自己的 provides，同时通过原型链继承父级 provides\nC. 为了把父组件 provides 清空\nD. 为了让所有 inject 都变成异步\n答案：B`,
        new: `### Q3 [single]\n在 Vue 3 中，某组件第一次调用 \`provide\` 时，Vue 为什么要执行 \`Object.create(parentProvides)\`？\nA. 为了深拷贝父组件提供的所有值\nB. 为了创建自己的 provides，同时通过原型链继承父级 provides\nC. 为了强行切断与祖先组件原型链的关联以防范样式污染\nD. 强制将 provides 实例注册为只读 Proxy 以提升响应式检索速度\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'vue/vue3-computed-scheduler.md'),
    replacements: [
      {
        old: `### Q2 [single]\nVue 3.5 中 \`computed\` 改用 version counting 替代单纯的 dirty flag，主要解决什么问题？\nA. 减少 Proxy 创建数量\nB. 避免多层 computed 嵌套时不必要的 getter 重新执行\nC. 让 computed 支持异步 getter\nD. 让 computed 可以有多个返回值\n答案：B`,
        new: `### Q2 [single]\nVue 3.5 中 \`computed\` 改用 version counting 替代单纯的 dirty flag，主要解决什么问题？\nA. 减少 Proxy 创建数量\nB. 避免多层 computed 嵌套时不必要的 getter 重新执行\nC. 实现对计算属性底层依赖 Link 双向关联节点的动态销毁\nD. 绕过微任务队列，强制以同步宏任务形式执行数据合并\n答案：B`
      }
    ]
  }
];

let totalApplied = 0;
for (const fileConfig of filesToRefactor) {
  if (!fs.existsSync(fileConfig.path)) {
    console.warn(`[WARN] 文件不存在: ${fileConfig.path}`);
    continue;
  }
  let content = fs.readFileSync(fileConfig.path, 'utf8');
  let fileApplied = 0;

  for (const replacement of fileConfig.replacements) {
    // 统一换行符为 \n 方便匹配
    const normContent = content.replace(/\r\n/g, '\n');
    const normOld = replacement.old.replace(/\r\n/g, '\n');
    
    if (normContent.includes(normOld)) {
      content = normContent.replace(normOld, replacement.new);
      fileApplied++;
      totalApplied++;
    } else {
      console.warn(`[WARN] 无法在文件 ${path.basename(fileConfig.path)} 中匹配到替换项。`);
    }
  }

  if (fileApplied > 0) {
    fs.writeFileSync(fileConfig.path, content, 'utf8');
    console.log(`[SUCCESS] 成功更新了文件: ${path.basename(fileConfig.path)}`);
  }
}

console.log(`[SUMMARY] 相对核心模块（Markdown专项自测）共替换了 ${totalApplied}/${filesToRefactor.length} 个文件。`);
