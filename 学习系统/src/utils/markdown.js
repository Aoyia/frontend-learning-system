import { marked } from 'marked';

export function renderMarkdownLink(href, title, text) {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
  if (isExternal) {
    const t = title ? ` title="${title}"` : ` title="${href}"`;
    return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer" class="doc-ref">${text}</a>`;
  }
  return `<a href="${href}">${text}</a>`;
}

marked.use({
  renderer: {
    link: renderMarkdownLink,
  },
});

export function normalizeMarkdown(content) {
  return content
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .replace(/==([\s\S]*?)==/g, '<mark>$1</mark>')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

export function stripHeadingText(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~[\]()#]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

export function slugifyHeading(text) {
  const slug = stripHeadingText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
  return slug || 'section';
}

export function extractMarkdownHeadings(markdown) {
  const used = new Map();
  const headings = [];
  let inFence = false;
  let fenceMarker = '';

  markdown.split('\n').forEach(line => {
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[2][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
      return;
    }
    if (inFence) return;

    const match = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (!match) return;

    const depth = match[1].length;
    const text = stripHeadingText(match[2]);
    const baseId = slugifyHeading(text);
    const count = used.get(baseId) || 0;
    used.set(baseId, count + 1);
    headings.push({
      depth,
      text,
      id: count ? `${baseId}-${count + 1}` : baseId,
    });
  });

  return headings;
}

export function renderMarkdownWithHeadings(content) {
  const markdown = normalizeMarkdown(content);
  const headings = extractMarkdownHeadings(markdown);
  let headingIndex = 0;
  const renderer = new marked.Renderer();
  renderer.link = renderMarkdownLink;
  renderer.heading = (text, level) => {
    const heading = headings[headingIndex];
    headingIndex += 1;
    const id = heading?.id || slugifyHeading(text);
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  return {
    html: marked.parse(markdown, { renderer }),
    headings,
    tocItems: headings.filter(heading => heading.depth === 2 || heading.depth === 3),
  };
}
