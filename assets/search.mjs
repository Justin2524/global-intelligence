export function filterReports(reports, { q = '', type = '', topic = '', month = '' } = {}) {
  const terms = q.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return reports.filter(r => (!type || r.type === type) && (!topic || r.topics.includes(topic)) && (!month || r.date.startsWith(month)) && terms.every(term => [r.title,r.body,r.date,...r.tags,...r.topics].join(' ').normalize('NFKC').toLocaleLowerCase().includes(term)));
}
