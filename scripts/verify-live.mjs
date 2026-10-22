import {createHash} from 'node:crypto';
const base = process.env.SITE_URL;
if (!base || !/^https:\/\/[\w.-]+\.github\.io\/global-intelligence\/$/.test(base)) throw Error('Missing or unexpected Pages URL');
const slug = process.env.REPORT_SLUG;
let lastError;
for(let attempt=0; attempt<16; attempt++) {
 try {
  const home = await fetch(`${base}?verify=${Date.now()}`, {signal: AbortSignal.timeout(15000)});
  if(!home.ok || !(await home.text()).includes('Global Intelligence')) throw Error('Homepage not available');
  const response = await fetch(`${base}search.json?verify=${Date.now()}`, {signal: AbortSignal.timeout(15000)});
  if(!response.ok) throw Error('Search index not available');
  const reports = await response.json();
  if(slug) {
    const report = reports.find(r => r.url === `/reports/${slug}/`);
    if(!report || createHash('sha256').update(report.body).digest('hex') !== process.env.BODY_SHA256) throw Error('Published index does not yet match submitted content');
    const page = await fetch(`${base}reports/${slug}/?verify=${Date.now()}`, {signal: AbortSignal.timeout(15000)});
    if(!page.ok || !(await page.text()).includes('class="prose')) throw Error('Report page not available');
  }
  console.log(`PASS: live Pages homepage, index${slug ? ' and exact report body' : ''}`); process.exit(0);
 } catch(error) {lastError=error; console.log(`Waiting for Pages propagation (${attempt+1}/16): ${error.message}`);}
 await new Promise(resolve=>setTimeout(resolve,15000));
}
throw lastError;
