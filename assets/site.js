(() => {
  const $ = id => document.getElementById(id);
  const query = new URLSearchParams(location.search);
  const topic = $('topic-filter');
  if (topic) {
    topic.value = query.get('topic') || '';
    const update = () => {
      let count = 0;
      document.querySelectorAll('[data-report]').forEach(row => {
        row.hidden = !!topic.value && !row.dataset.topics.split(' ').includes(topic.value);
        if (!row.hidden) count++;
      });
      document.querySelectorAll('[data-topic-link]').forEach(a => a.toggleAttribute('aria-current', a.dataset.topicLink === topic.value));
      $('result-count').textContent = `${count} 篇文章`;
      $('no-results').hidden = count > 0;
      const params = new URLSearchParams(); if (topic.value) params.set('topic', topic.value);
      history.replaceState(null, '', `${location.pathname}${params.size ? '?' + params : ''}`);
    };
    topic.addEventListener('change', update); update();
  }
  const app = $('search-app');
  if (app) {
    const inputs = { q: $('search'), type: $('type-filter'), topic: $('archive-topic'), month: $('month-filter') };
    for (const [key, el] of Object.entries(inputs)) el.value = query.get(key) || '';
    const status = $('search-status'), results = $('search-results');
    Promise.all([fetch(app.dataset.index).then(r => { if (!r.ok) throw Error('Index unavailable'); return r.json(); }), import('./search.mjs')]).then(([reports, { filterReports }]) => {
      const render = () => {
        const filters = Object.fromEntries(Object.entries(inputs).map(([key, el]) => [key, el.value]));
        const matches = filterReports(reports, filters);
        results.replaceChildren();
        for (const report of matches) {
          const article = document.createElement('article'); article.className = 'search-result';
          const meta = document.createElement('small'); meta.textContent = `${report.date} · ${report.type}${report.demo ? ' · Demo' : ''}`;
          const heading = document.createElement('h2'), link = document.createElement('a');
          link.href = app.dataset.base + report.url; link.textContent = report.title; heading.append(link);
          const description = document.createElement('p'); description.textContent = report.summary;
          const tags = document.createElement('small'); tags.textContent = report.tags.join(' / ');
          article.append(meta,heading,description,tags); results.append(article);
        }
        status.textContent = matches.length ? `找到 ${matches.length} 篇文章` : '没有匹配结果。试试更短的关键词，或清除筛选。';
        const params = new URLSearchParams(Object.entries(filters).filter(([,value]) => value));
        history.replaceState(null, '', `${location.pathname}${params.size ? '?' + params : ''}`);
      };
      Object.values(inputs).forEach(el => el.addEventListener('input', render));
      $('reset-filters').addEventListener('click', () => { Object.values(inputs).forEach(el => { el.value = ''; }); render(); inputs.q.focus(); });
      render();
    }).catch(() => { status.textContent = '搜索索引暂时无法加载。请刷新页面，或使用下方日期归档。'; });
  }
  if (matchMedia('(max-width: 640px)').matches) document.querySelectorAll('.toc details').forEach(el => { el.open = false; });
})();
