import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import katex from 'katex';
import YAML from 'yaml';
import { createHash } from 'node:crypto';

export const TOPICS = { macro: '金融宏观', technology: 'AI与科技', markets: '金融市场', geopolitics: '国际政治与地缘风险' };
export const FORM = ['报告类型 / Report type', '报告日期 / Report date', '报告正文 / Markdown'];
export class ValidationError extends Error {}
export const check = (condition, message) => { if (!condition) throw new ValidationError(message); };
export function validDate(value) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), '日期必须使用 YYYY-MM-DD。');
  const parsed = new Date(`${value}T00:00:00Z`);
  check(Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value && value >= '2000-01-01' && value <= '2100-12-31', '日期不存在，或不在 2000–2100 年范围内。');
  return value;
}
export const digest = body => createHash('sha256').update(body).digest('hex');
function math(tex, displayMode) {
  try { return katex.renderToString(tex, { displayMode, output: 'mathml', trust: false, strict: 'error', throwOnError: true, maxExpand: 1000 }); }
  catch { throw new ValidationError('公式无法解析：请使用受支持的 LaTeX 数学表达式。'); }
}
const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: false });
md.inline.ruler.after('escape', 'math_inline', (state, silent) => {
  const start = state.pos;
  if (state.src[start] !== '$' || state.src[start + 1] === '$' || /\s/.test(state.src[start + 1] || ' ')) return false;
  let end = start + 1;
  while ((end = state.src.indexOf('$', end)) !== -1 && state.src[end - 1] === '\\') end++;
  if (end === -1 || /\s/.test(state.src[end - 1]) || state.src.slice(start, end).includes('\n')) return false;
  if (!silent) { const token = state.push('math_inline', 'math', 0); token.content = state.src.slice(start + 1, end); }
  state.pos = end + 1; return true;
});
md.block.ruler.before('fence', 'math_block', (state, startLine, endLine, silent) => {
  const first = state.getLines(startLine, startLine + 1, 0, false).trim();
  if (first !== '$$') return false;
  let next = startLine + 1;
  while (next < endLine && state.getLines(next, next + 1, 0, false).trim() !== '$$') next++;
  if (next >= endLine) throw new ValidationError('块级公式缺少结束的 $$。');
  if (silent) return true;
  const token = state.push('math_block', 'math', 0); token.content = state.getLines(startLine + 1, next, 0, false); token.block = true;
  state.line = next + 1; return true;
});
md.renderer.rules.math_inline = (tokens, idx) => math(tokens[idx].content, false);
md.renderer.rules.math_block = (tokens, idx) => `<div class="formula">${math(tokens[idx].content, true)}</div>`;
md.renderer.rules.image = (tokens, idx) => md.utils.escapeHtml(`[图片：${tokens[idx].content}]`);
const mathTags = ['math','semantics','mrow','mi','mn','mo','msup','msub','msubsup','mfrac','msqrt','mroot','mtext','mspace','mtable','mtr','mtd','munder','mover','munderover','mpadded','mstyle','menclose','mphantom','annotation'];
export function renderMarkdown(body) {
  const tokens = md.parse(body, {}), toc = [], sources = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open') {
      const title = (tokens[i + 1].children || []).map(t => t.type === 'text' || t.type === 'code_inline' || t.type === 'math_inline' ? t.content : '').join('');
      const id = `section-${toc.length + 1}`;
      tokens[i].attrSet('id', id);
      toc.push({ id, title, level: Number(tokens[i].tag.slice(1)) });
    }
    for (const child of tokens[i].children || []) {
      if (child.type === 'link_open') {
        const url = child.attrGet('href');
        if (/^https?:\/\//i.test(url) && !sources.includes(url)) sources.push(url);
        child.attrSet('rel', 'noopener noreferrer');
      }
    }
  }
  const html = sanitizeHtml(md.renderer.render(tokens, md.options, {}), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, ...mathTags],
    allowedAttributes: { a: ['href','title','rel'], h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'], code: ['class'], div: ['class'], span: ['class'], math: ['xmlns','display'], annotation: ['encoding'], '*': ['mathvariant','stretchy','fence','separator','accent','accentunder','columnalign','rowspacing','columnspacing','linethickness','width','height','depth','lspace','rspace','displaystyle','scriptlevel'] },
    allowedSchemes: ['https','http','mailto'], allowProtocolRelative: false,
    parser: { lowerCaseTags: true }
  });
  return { html, toc, sources };
}
export function reportMetadata(body, type, date) {
  check(typeof body === 'string' && Buffer.byteLength(body) <= 60000, '正文不得超过 60 KB。');
  body = body.replace(/\r\n?/g, '\n').trim();
  check(body.length >= 80 && !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(body), '正文过短或包含控制字符。');
  check(/^# [^\n]+\n/.test(body), '正文必须以一个 # 标题开头，不要包裹整篇代码块，也不要包含 Front Matter。');
  const rendered = renderMarkdown(body);
  check(rendered.toc.filter(t => t.level === 1).length === 1, '正文只能包含一个一级标题。');
  const headings = rendered.toc.filter(t => t.level === 2);
  if (type === 'daily') check(headings.length === 10 && headings.every((t, i) => new RegExp(`^${i + 1}[.、．]\\s*\\S`).test(t.title)), 'Daily 必须包含十个二级标题，依次为 ## 1. 标题 至 ## 10. 标题。');
  else check(headings.length >= 2, 'Weekly 至少需要两个 ## 二级标题。');
  check(rendered.sources.length > 0, '请至少添加一个 http(s) 原始来源 Markdown 链接。');
  const categoryLine = body.match(/^分类[：:]\s*(.+)$/m);
  const categories = categoryLine ? categoryLine[1].split(/[,，、]/).map(x => x.trim()) : [type === 'daily' ? 'macro' : 'geopolitics'];
  const topics = [...new Set(categories.map(c => Object.keys(TOPICS).find(k => k === c || TOPICS[k] === c.replace(/\s/g, ''))))];
  check(topics.length > 0 && topics.every(Boolean), `分类仅支持：${Object.keys(TOPICS).join(', ')}。`);
  const tagLine = body.match(/^标签[：:]\s*(.+)$/m);
  const tags = tagLine ? [...new Set(tagLine[1].split(/[,，、]/).map(x => x.trim()).filter(Boolean))] : [];
  check(tags.length <= 12 && tags.every(t => t.length <= 40 && !/[<>]/.test(t)), '最多 12 个标签，每个不超过 40 字，不能含尖括号。');
  const title = rendered.toc[0].title;
  check(title.length > 0 && title.length <= 160, '标题必须在 1–160 字之间。');
  const summary = body.split('\n').find((l, i) => i > 0 && l.trim() && !/^(#|分类|标签|\$|>|\[)/.test(l)) || '阅读完整报告与原始来源。';
  return { title, date: validDate(date), type, topics, tags, summary: summary.slice(0, 220), demo: /\bdemo\b/i.test(title), body, ...rendered };
}
export function parseIssue(event, repository) {
  const { issue, sender, repository: repo } = event;
  check(repo?.full_name === repository && repo.owner?.type === 'User', '只支持当前个人账户仓库。');
  check(issue && !issue.pull_request && issue.state === 'open', '只处理打开状态的 Issue。');
  check(Number.isSafeInteger(repo.owner.id) && issue.user?.id === repo.owner.id && sender?.id === repo.owner.id, '只有仓库 Owner 本人创建并提交或编辑的 Issue 可以发布。');
  check(['opened','edited','reopened'].includes(event.action), '不支持此 Issue 事件。');
  check(issue.labels?.some(l => l.name === 'publish-report') && issue.title?.startsWith('[Publish]'), '请使用「发布新闻报告」表单，保留 [Publish] 标题与 publish-report 标签。');
  const raw = issue.body?.replace(/\r\n?/g, '\n').trim() || '';
  const escaped = FORM.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`^### ${escaped[0]}\\n+([^\\n]+)\\n+### ${escaped[1]}\\n+([^\\n]+)\\n+### ${escaped[2]}\\n+([\\s\\S]+)$`);
  const match = raw.match(pattern);
  check(match, '表单结构不正确：请通过指定表单填写类型、日期与 Markdown 正文。');
  check(['Daily','Weekly'].includes(match[1].trim()), '报告类型只能为 Daily 或 Weekly。');
  const report = reportMetadata(match[3], match[1].trim().toLowerCase(), match[2].trim());
  return { ...report, issue: issue.number, source_issue: `https://github.com/${repository}/issues/${issue.number}`, submitted_by: issue.user.login, body_sha256: digest(report.body) };
}
export function serializeReport(report) {
  const { body, html, toc, sources, ...front } = report;
  return `---\n${JSON.stringify({ schema: 1, ...front }, null, 2)}\n---\n\n${body}\n`;
}
export function readReport(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  check(match, '文章缺少合法 Front Matter。');
  const front = YAML.parse(match[1]);
  check(front.schema === 1 && ['daily','weekly','knowledge'].includes(front.type), '未知文章 schema 或 type。');
  const body = match[2].trim();
  const data = front.type === 'knowledge' ? { ...renderMarkdown(body), body } : reportMetadata(body, front.type, front.date);
  check(!front.body_sha256 || front.body_sha256 === digest(body), '正文哈希不一致。');
  return { ...front, ...data };
}
