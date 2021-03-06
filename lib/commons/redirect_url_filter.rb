class RedirectURLFilter < HTML::Pipeline::Filter
  def call
    doc.search('a').each do |node|
      url = node.attr('href')
      next unless url

      next if url.index('#') == 0 # OK: #hoge
      next if url.match(/\A\/[^\/]/) # OK: /hoge
      if GlobalSetting.root_url.present?
        next if url.index("#{GlobalSetting.root_url}/") == 0 # OK: http://podmum-url/hoge
        next if url.index("//#{GlobalSetting.root_url.sub(/\Ahttps?:/, '')}/") == 0 # OK: //podmum-url/hoge
      end

      node.set_attribute('href', "/redirect?url=#{URI.escape(url)}")
    end
    doc
  end
end
