module GlobalIntelligence
  class ReportPages < Jekyll::Generator
    safe true
    def generate(site)
      (site.data['reports'] || []).each do |report|
        page = Jekyll::PageWithoutAFile.new(site, site.source, "reports/#{report['slug']}", 'index.html')
        page.content = ''
        page.data = { 'layout' => report['type'], 'title' => report['title'], 'report' => report }
        site.pages << page
      end
    end
  end
end
