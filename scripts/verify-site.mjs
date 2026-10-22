import fs from 'node:fs';
import assert from 'node:assert/strict';
const site = '_site';
for (const file of ['index.html','daily/index.html','weekly/index.html','topics/index.html','knowledge/index.html','archive/index.html','about/index.html','404.html','assets/style.css','assets/site.js','assets/search.mjs']) assert.ok(fs.existsSync(`${site}/${file}`), `Missing ${file}`);
const index = JSON.parse(fs.readFileSync(`${site}/search.json`, 'utf8'));
assert.ok(index.some(r=>r.type==='daily')); assert.ok(index.some(r=>r.type==='weekly'));
for (const report of index) {
 const html=fs.readFileSync(`${site}${report.url}index.html`, 'utf8');
 assert.ok(html.includes('class="prose ' + report.type + '"'));
 assert.ok(html.includes('本篇目录'));
 assert.ok(!/<script(?! src="\/global-intelligence\/assets\/site.js" defer>)/.test(html), 'Unexpected script');
 assert.ok(!/\son[a-z]+\s*=/.test(html), 'Unexpected event attribute');
 assert.ok(!/<iframe|javascript:/i.test(html), 'Unsafe output');
}
for(const file of ['README.md','Gemfile','package.json','reports/2026-10-21-daily.md','scripts/ingest.mjs','.github/workflows/publish.yml']) assert.ok(!fs.existsSync(`${site}/${file}`), `Source leaked: ${file}`);
const weekly=fs.readFileSync(`${site}/reports/2026-10-21-weekly/index.html`,'utf8');
assert.ok(weekly.includes('<math')); assert.ok(weekly.includes('<table>')); assert.ok(weekly.includes('https://www.economist.com/'));
console.log(`PASS: ${index.length} articles, all routes, layouts, Chinese, Markdown tables, MathML, sources and source exclusion.`);
