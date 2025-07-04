const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Crawl full article content from a news URL.
 * Returns: { items: [ { type: 'text', text, html }, { type: 'image', url, caption } ] }
 * The 'html' field preserves <b>, <strong>, <i>, <em> tags for bold/italic.
 */
async function fetchArticleContent(url) {
  try {
    const { data: html } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(html);
    const items = [];

    // Try common article content selectors
    const content =
      $(
        'article.fck_detail, div.detail-content, div.article__body, div.singular-content, div.maincontent.main-content, div.e-magazine__body.dnews__body'
      ).first();

    if (!content || content.length === 0) {
      return { items: [{ type: 'text', text: 'Không tìm thấy nội dung bài viết.' }] };
    }

    content.children().each((_, el) => {
      const tag = el.tagName?.toLowerCase();
      const elem = $(el);
      if (["p", "h1", "h2", "h3"].includes(tag)) {
        const text = elem.text().trim();
        // Preserve bold/italic by extracting HTML for this element
        const htmlContent = elem.html();
        if (text) items.push({ type: 'text', text, html: htmlContent });
      } else if (tag === 'div' && elem.hasClass('VCSortableInPreviewMode')) {
        // Multi-figure (e.g. Thanh Niên)
        const images = elem.find('figure.media-item img');
        const caption = elem.find('figcaption p').first().text().trim() || '';
        images.each((_, img) => {
          const $img = $(img);
          const src = $img.attr('data-original') || $img.attr('src') || '';
          if (src) items.push({ type: 'image', url: src, caption });
        });
      } else if (tag === 'figure') {
        // Single figure
        const img = elem.find('img').first();
        const src = img.attr('data-src') || img.attr('data-original') || img.attr('src') || '';
        const caption = elem.find('figcaption').text().trim() || '';
        if (src) items.push({ type: 'image', url: src, caption });
      }
    });

    if (items.length === 0) {
      return { items: [{ type: 'text', text: 'Không tìm thấy nội dung bài viết.' }] };
    }
    return { items };
  } catch (e) {
    return { items: [{ type: 'text', text: `Không thể tải bài viết: ${e.message}` }] };
  }
}

module.exports = { fetchArticleContent };
