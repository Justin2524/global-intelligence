import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import {FORM,parseIssue,renderMarkdown,reportMetadata,serializeReport,readReport,validDate} from '../scripts/content.mjs';
import {ingest} from '../scripts/ingest.mjs';
import {filterReports} from '../assets/search.mjs';
const daily = fs.readFileSync(new URL('../templates/daily.md', import.meta.url),'utf8');
const weekly = fs.readFileSync(new URL('../templates/weekly.md', import.meta.url),'utf8');
const repo = 'tester/global-intelligence';
const event = (body=daily,type='Daily',date='2026-10-22') => ({action:'opened',repository:{full_name:repo,owner:{id:123,login:'tester',type:'User'}},sender:{id:123},issue:{number:1,state:'open',user:{id:123,login:'tester'},labels:[{name:'publish-report'}],title:'[Publish] test',body:`### ${FORM[0]}\n\n${type}\n\n### ${FORM[1]}\n\n${date}\n\n### ${FORM[2]}\n\n${body}`}});
test('accepts owner Daily and Weekly using shared schema',()=>{
 for(const [body,type] of [[daily,'Daily'],[weekly,'Weekly']]) {
  const report=parseIssue(event(body,type),repo);
  assert.equal(report.type,type.toLowerCase()); assert.ok(report.html.includes('Demo')); assert.ok(report.sources.length);
  assert.equal(readReport(serializeReport(report)).title,report.title);
 }
});
test('rejects non-owner author, sender, impersonation and organization',()=>{
 for(const mutate of [e=>e.issue.user.id=987,e=>e.sender.id=987,e=>e.repository.owner.type='Organization',e=>e.repository.owner.id=undefined,e=>e.repository.full_name='other/repo']) {
  const e=event();mutate(e);assert.throws(()=>parseIssue(e,repo));
 }
});
test('requires open Issue, supported action, template shape and label',()=>{
 for(const mutate of [e=>e.issue.state='closed',e=>e.issue.pull_request={},e=>e.action='deleted',e=>e.issue.labels=[],e=>e.issue.title='not form',e=>e.issue.body=e.issue.body.replace('Report type','Other field')]) {
  const e=event();mutate(e);assert.throws(()=>parseIssue(e,repo));
 }
});
test('invalid dates and path traversal are rejected',()=>{
 for(const date of ['2026-02-30','2025-02-29','2026-13-01','../../x','2026-1-1','2026-00-01','2026-10-22\nvalue=x','1999-12-31']) assert.throws(()=>validDate(date));
 assert.equal(validDate('2024-02-29'),'2024-02-29');
});
test('types and structural constraints are enforced',()=>{
 assert.throws(()=>parseIssue(event(daily,'../../evil'),repo));
 assert.throws(()=>reportMetadata(daily.replace('## 10.','## 11.'),'daily','2026-10-22'));
 assert.throws(()=>reportMetadata('```markdown\n'+daily+'\n```','daily','2026-10-22'));
 assert.throws(()=>reportMetadata(daily.replaceAll('https://','javascript:'),'daily','2026-10-22'));
 assert.throws(()=>reportMetadata('# title\n\n'+ 'x'.repeat(61000),'weekly','2026-10-22'));
 assert.throws(()=>reportMetadata(weekly.replace('macro','invalid-topic'),'weekly','2026-10-22'));
});
test('sanitizes HTML, dangerous URLs, images; Liquid remains inert data',()=>{
 const attack='\n<script>alert(1)</script>\n<img src=x onerror=alert(2)>\n<iframe src="https://evil.example"></iframe>\n[x](javascript:alert%281%29)\n[x](data:text/html,test)\n![x](https://evil.example/track.png)\n{{ site.secret }} {% include evil %} $(touch /tmp/evil)\n';
 const r=renderMarkdown(attack);
 assert.ok(!/<script|<img|<iframe|href="(?:javascript|data):/i.test(r.html));
 assert.ok(r.html.includes('{{ site.secret }}'));assert.ok(r.html.includes('$(touch'));
});
test('MathML, tables, Chinese, English, heading IDs and safe links render',()=>{
 const r=renderMarkdown(weekly);
 assert.ok(r.html.includes('<math'));assert.ok(r.html.includes('<mfrac>'));assert.ok(r.html.includes('<table>'));
 assert.ok(r.html.includes('生产率'));assert.ok(r.html.includes('https://www.economist.com/'));
 assert.equal(new Set(r.toc.map(x=>x.id)).size,r.toc.length);
 assert.throws(()=>renderMarkdown('$$\nx+1\n'));
});
test('duplicate reports cannot overwrite; identical original Issue can retry',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'gi-ingest-'));
 try {
  const result=ingest(event(),root,repo), file=path.join(root,result.path), before=fs.readFileSync(file,'utf8');
  assert.equal(result.status,'created');assert.equal(ingest(event(),root,repo).status,'retry');
  const duplicate=event();duplicate.issue.number=2;assert.throws(()=>ingest(duplicate,root,repo),/拒绝覆盖/);
  assert.throws(()=>ingest(event(daily+'\nextra'),root,repo),/拒绝覆盖/);
  assert.equal(fs.readFileSync(file,'utf8'),before);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('invalid Issue never writes a report',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'gi-reject-'));
 try {const e=event();e.issue.user.id=9;assert.throws(()=>ingest(e,root,repo));assert.deepEqual(fs.readdirSync(root),[]);}
 finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('Chinese and English full text, tags and intersecting filters work',()=>{
 const reports=[{title:'生产率 Demo',body:'Understanding AI',tags:['金融'],topics:['macro'],type:'weekly',date:'2026-10-22'}];
 for(const q of ['生产率','ai','ＡＩ','金融','understanding ai']) assert.equal(filterReports(reports,{q}).length,1);
 assert.equal(filterReports(reports,{q:'ai',type:'weekly',topic:'macro',month:'2026-10'}).length,1);
 for(const filter of [{q:'missing'},{type:'daily'},{topic:'markets'},{month:'2025-10'}]) assert.equal(filterReports(reports,filter).length,0);
});
test('Issue Form has exactly three required fields with matching contract',()=>{
 const form=YAML.parse(fs.readFileSync('.github/ISSUE_TEMPLATE/publish-report.yml','utf8'));
 const fields=form.body.filter(x=>x.type!=='markdown');
 assert.deepEqual(fields.map(x=>x.attributes.label),FORM);assert.ok(fields.every(x=>x.validations.required));
 assert.deepEqual(form.labels,['publish-report']);
});
test('workflow separates privileges and waits for verified deployment',()=>{
 const text=fs.readFileSync('.github/workflows/publish.yml','utf8'), wf=YAML.parse(text);
 assert.deepEqual(wf.permissions,{}); assert.deepEqual(wf.jobs.build.permissions,{contents:'read'});
 assert.deepEqual(wf.jobs.archive.permissions,{contents:'write'});assert.deepEqual(wf.jobs.deploy.permissions,{pages:'write','id-token':'write'});
 assert.ok(wf.jobs.notify.needs.includes('verify'));
 assert.ok(!text.includes('${{ github.event.issue.body }}'));assert.ok(!text.includes('pull_request_target'));
});
