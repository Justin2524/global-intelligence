import fs from 'node:fs';
import { readReport, check } from './content.mjs';
const reports = fs.readdirSync('reports').filter(n => n.endsWith('.md')).map(file => {
  check(/^\d{4}-\d{2}-\d{2}-(daily|weekly|knowledge-[a-z0-9-]+)\.md$/.test(file), '文章文件名不符合规范。');
  check(!fs.lstatSync(`reports/${file}`).isSymbolicLink(), '禁止符号链接文章。');
  const report = readReport(fs.readFileSync(`reports/${file}`, 'utf8'));
  const slug = file.slice(0, -3);
  check(file.startsWith(`${report.date}-${report.type}`), '文件名与文章元数据不一致。');
  return { ...report, slug, url: `/reports/${slug}/`, reading_minutes: Math.max(1, Math.ceil(report.body.length / 650)) };
}).sort((a,b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
fs.mkdirSync('_data', { recursive: true });
fs.writeFileSync('_data/reports.json', JSON.stringify(reports));
console.log(`Prepared ${reports.length} reports; HTML sanitized, Liquid never evaluated.`);
