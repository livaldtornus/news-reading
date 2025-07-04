const Parser = require('rss-parser');
const { supabase } = require('./supabase');

// Hàm decode HTML entities
function decodeHtmlEntities(text) {
  if (!text) return text;
  
  const entities = {
    '&agrave;': 'à', '&aacute;': 'á', '&acirc;': 'â', '&atilde;': 'ã', '&auml;': 'ä',
    '&egrave;': 'è', '&eacute;': 'é', '&ecirc;': 'ê', '&euml;': 'ë',
    '&igrave;': 'ì', '&iacute;': 'í', '&icirc;': 'î', '&iuml;': 'ï',
    '&ograve;': 'ò', '&oacute;': 'ó', '&ocirc;': 'ô', '&otilde;': 'õ', '&ouml;': 'ö',
    '&ugrave;': 'ù', '&uacute;': 'ú', '&ucirc;': 'û', '&uuml;': 'ü',
    '&ygrave;': 'ỳ', '&yacute;': 'ý', '&ycirc;': 'ŷ', '&yuml;': 'ÿ',
    '&Agrave;': 'À', '&Aacute;': 'Á', '&Acirc;': 'Â', '&Atilde;': 'Ã', '&Auml;': 'Ä',
    '&Egrave;': 'È', '&Eacute;': 'É', '&Ecirc;': 'Ê', '&Euml;': 'Ë',
    '&Igrave;': 'Ì', '&Iacute;': 'Í', '&Icirc;': 'Î', '&Iuml;': 'Ï',
    '&Ograve;': 'Ò', '&Oacute;': 'Ó', '&Ocirc;': 'Ô', '&Otilde;': 'Õ', '&Ouml;': 'Ö',
    '&Ugrave;': 'Ù', '&Uacute;': 'Ú', '&Ucirc;': 'Û', '&Uuml;': 'Ü',
    '&Ygrave;': 'Ỳ', '&Yacute;': 'Ý', '&Ycirc;': 'Ŷ', '&Yuml;': 'Ÿ',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç',
    '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&nbsp;': ' ', '&hellip;': '...', '&mdash;': '—', '&ndash;': '–',
    '&lsquo;': "'", '&rsquo;': "'", '&apos;': "'"
  };
  
  let decodedText = text;
  for (const [entity, char] of Object.entries(entities)) {
    decodedText = decodedText.replace(new RegExp(entity, 'g'), char);
  }

  // Decode numeric entities (decimal and hex)
  decodedText = decodedText.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  decodedText = decodedText.replace(/&#x([\da-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decodedText;
}

// Map tên báo sang source_id và icon
const SOURCE_MAPPING = {
  'Tuổi Trẻ': {
    id: 1,
    name: 'Tuổi Trẻ',
    icon_url: 'https://statictuoitre.mediacdn.vn/web_images/favicon.ico',
    domain: 'tuoitre.vn'
  },
  'Thanh Niên': {
    id: 2,
    name: 'Thanh Niên',
    icon_url: 'https://thanhnien.vn/favicon.ico',
    domain: 'thanhnien.vn'
  },
  'Dân Trí': {
    id: 3,
    name: 'Dân Trí',
    icon_url: 'https://dantri.com.vn/favicon.ico',
    domain: 'dantri.com.vn'
  },
  'Pháp Luật': {
    id: 4,
    name: 'Pháp Luật',
    icon_url: 'https://static-cms-plo.epicdn.me/v4/web/styles/img/favicon.png',
    domain: 'plo.vn'
  },
  'VietNamNet': {
    id: 5,
    name: 'VietNamNet',
    icon_url: 'https://vietnamnet.vn/favicon.ico',
    domain: 'vietnamnet.vn'
  },
  'VnExpress': {
    id: 6,
    name: 'VnExpress',
    icon_url: 'https://vnexpress.net/favicon.ico',
    domain: 'vnexpress.net'
  }
};

// Hàm đảm bảo news_sources table được tạo và populate
async function ensureNewsSourcesTable() {
  try {
    // Populate dữ liệu sources
    const sourcesToInsert = Object.values(SOURCE_MAPPING).map(source => ({
      id: source.id,
      name: source.name,
      icon_url: source.icon_url,
      domain: source.domain,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error: upsertError } = await supabase
      .from('news_sources')
      .upsert(sourcesToInsert, { onConflict: 'id' });
    
    if (upsertError) {
      console.error('Lỗi khi upsert news_sources:', upsertError);
    } else {
      console.log('Đã cập nhật news_sources table');
    }
  } catch (error) {
    console.error('Lỗi khi đảm bảo news_sources table:', error);
  }
}

const RSS_FEEDS = [
  // Tin mới (category_id = 1)
  { url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', source: 'Tuổi Trẻ', category_id: 1 },
  { url: 'https://thanhnien.vn/rss/home.rss', source: 'Thanh Niên', category_id: 1 },
  { url: 'https://dantri.com.vn/rss/home.rss', source: 'Dân Trí', category_id: 1 },
  { url: 'https://plo.vn/rss/home.rss', source: 'Pháp Luật', category_id: 1 },
  { url: 'https://vietnamnet.vn/thoi-su.rss', source: 'VietNamNet', category_id: 1 },
  // Thế giới (category_id = 2)
  { url: 'https://plo.vn/rss/quoc-te-8.rss', source: 'Pháp Luật', category_id: 2 },
  { url: 'https://dantri.com.vn/rss/the-gioi.rss', source: 'Dân Trí', category_id: 2 },
  { url: 'https://vnexpress.net/rss/the-gioi.rss', source: 'VnExpress', category_id: 2 },
  { url: 'https://thanhnien.vn/rss/the-gioi.rss', source: 'Thanh Niên', category_id: 2 },
  { url: 'https://tuoitre.vn/rss/the-gioi.rss', source: 'Tuổi Trẻ', category_id: 2 },
  { url: 'https://vietnamnet.vn/the-gioi.rss', source: 'VietNamNet', category_id: 2 },
  // Kinh tế (category_id = 3)
  { url: 'https://thanhnien.vn/rss/kinh-te.rss', source: 'Thanh Niên', category_id: 3 },
  { url: 'https://vnexpress.net/rss/kinh-doanh.rss', source: 'VnExpress', category_id: 3 },
  { url: 'https://dantri.com.vn/rss/kinh-doanh.rss', source: 'Dân Trí', category_id: 3 },
  { url: 'https://plo.vn/rss/kinh-te-13.rss', source: 'Pháp Luật', category_id: 3 },
  { url: 'https://vietnamnet.vn/kinh-doanh.rss', source: 'VietNamNet', category_id: 3 },
  // Đời sống (category_id = 4)
  { url: 'https://tuoitre.vn/rss/nhip-song-tre.rss', source: 'Tuổi Trẻ', category_id: 4 },
  { url: 'https://thanhnien.vn/rss/doi-song.rss', source: 'Thanh Niên', category_id: 4 },
  { url: 'https://vnexpress.net/rss/gia-dinh.rss', source: 'VnExpress', category_id: 4 },
  { url: 'https://dantri.com.vn/rss/doi-song.rss', source: 'Dân Trí', category_id: 4 },
  // Sức khỏe (category_id = 5)
  { url: 'https://tuoitre.vn/rss/suc-khoe.rss', source: 'Tuổi Trẻ', category_id: 5 },
  { url: 'https://thanhnien.vn/rss/suc-khoe.rss', source: 'Thanh Niên', category_id: 5 },
  { url: 'https://vnexpress.net/rss/suc-khoe.rss', source: 'VnExpress', category_id: 5 },
  { url: 'https://dantri.com.vn/rss/suc-khoe.rss', source: 'Dân Trí', category_id: 5 },
  // Văn hóa (category_id = 6)
  { url: 'https://tuoitre.vn/rss/van-hoa.rss', source: 'Tuổi Trẻ', category_id: 6 },
  { url: 'https://thanhnien.vn/rss/van-hoa.rss', source: 'Thanh Niên', category_id: 6 },
  // Giải trí (category_id = 7)
  { url: 'https://tuoitre.vn/rss/giai-tri.rss', source: 'Tuổi Trẻ', category_id: 7 },
  { url: 'https://thanhnien.vn/rss/giai-tri.rss', source: 'Thanh Niên', category_id: 7 },
  { url: 'https://vnexpress.net/rss/suc-khoe.rss', source: 'VnExpress', category_id: 7 },
  { url: 'https://dantri.com.vn/rss/giai-tri.rss', source: 'Dân Trí', category_id: 7 },
  // Thể thao (category_id = 8)
  { url: 'https://tuoitre.vn/rss/the-thao.rss', source: 'Tuổi Trẻ', category_id: 8 },
  { url: 'https://thanhnien.vn/rss/the-thao.rss', source: 'Thanh Niên', category_id: 8 },
  { url: 'https://vnexpress.net/rss/the-thao.rss', source: 'VnExpress', category_id: 8 },
  { url: 'https://dantri.com.vn/rss/the-thao.rss', source: 'Dân Trí', category_id: 8 },
  // Công nghệ (category_id = 9)
  { url: 'https://tuoitre.vn/rss/nhip-song-so.rss', source: 'Tuổi Trẻ', category_id: 9 },
  { url: 'https://thanhnien.vn/rss/cong-nghe.rss', source: 'Thanh Niên', category_id: 9 },
  { url: 'https://vnexpress.net/rss/cong-nghe.rss', source: 'VnExpress', category_id: 9 },
  { url: 'https://dantri.com.vn/rss/cong-nghe.rss', source: 'Dân Trí', category_id: 9 },
];

// Cache toàn cục cho tất cả bài viết
const globalCache = {
  articles: [],
  lastCrawlTime: 0,
  seenUrls: new Set()
};

// Cache theo category
const categoryCache = {};

const CRAWL_INTERVAL = 5 * 60 * 1000; // 5 phút

// Hàm phụ để lấy URL ảnh đầu tiên từ chuỗi HTML
function extractFirstImageUrl(html) {
  if (!html) return null;
  
  // Tìm tất cả thẻ img trong HTML với cả nháy đơn và nháy kép
  const imgMatches = html.match(/<img[^>]+src=['"]([^'"]+)['"]/gi);
  if (imgMatches && imgMatches.length > 0) {
    // Lấy URL từ match đầu tiên (hỗ trợ cả nháy đơn và nháy kép)
    const urlMatch = imgMatches[0].match(/src=['"]([^'"]+)['"]/i);
    return urlMatch ? urlMatch[1] : null;
  }
  
  // Fallback: tìm thẻ img đơn giản với nháy kép
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : null;
}

// Hàm phụ để lấy ảnh từ RSS feed image tag
function extractRssImageUrl(feedData) {
  if (!feedData.image) return null;
  
  // Kiểm tra các format khác nhau của image tag
  if (feedData.image.url) {
    return feedData.image.url;
  }
  
  // Nếu image là string (URL trực tiếp)
  if (typeof feedData.image === 'string') {
    return feedData.image;
  }
  
  // Nếu image là object với các thuộc tính khác
  if (feedData.image.link) {
    return feedData.image.link;
  }
  
  return null;
}

// Hàm crawl một feed và trả về các bài viết mới
async function crawlFeed(feed) {
  const parser = new Parser();
  try {
    const feedData = await parser.parseURL(feed.url);
    const newArticles = [];
    
    // Lấy ảnh mặc định từ RSS feed nếu có
    const defaultImageUrl = extractRssImageUrl(feedData);
    
    for (const item of feedData.items) {
      const articleUrl = item.link;
      
      // Chỉ thêm bài viết mới (chưa có URL trong cache)
      if (!globalCache.seenUrls.has(articleUrl)) {
        // Ưu tiên thứ tự: enclosure > description image > content image > RSS feed image > null
        const thumbnail =
          item.enclosure?.url ||
          extractFirstImageUrl(item.description) ||  // Thêm description vào ưu tiên
          extractFirstImageUrl(item.content || item['content:encoded']) ||
          defaultImageUrl ||
          null;
        
        let title = decodeHtmlEntities(item.title);
        // Xử lý VietnamNet: loại bỏ dấu space ở đầu tiêu đề
        if (feed.source === 'VietNamNet' && title) {
          title = title.trimStart();
        }
        const article = {
          id: item.guid || articleUrl, // Sử dụng URL làm ID nếu không có GUID
          title,
          url: articleUrl,
          description: decodeHtmlEntities(item.contentSnippet),
          thumbnail_url: thumbnail,
          published_at: item.isoDate,
          source: feed.source,
          category_id: feed.category_id,
        };
        
        newArticles.push(article);
        globalCache.seenUrls.add(articleUrl);
      }
    }
    
    return newArticles;
  } catch (err) {
    console.error('Lỗi khi parse feed:', feed.url, err.message);
    return [];
  }
}

// Hàm crawl tất cả feeds và bổ sung dữ liệu mới
async function crawlAllFeeds() {
  console.log('Bắt đầu crawl RSS feeds...');
  const startTime = Date.now();
  
  // Đảm bảo news_sources table được tạo và populate
  await ensureNewsSourcesTable();
  
  // Crawl song song tất cả feeds
  const results = await Promise.all(RSS_FEEDS.map(crawlFeed));
  
  // Gộp tất cả bài viết mới
  const newArticles = results.flat();
  
  if (newArticles.length > 0) {
    // Chuẩn hóa dữ liệu cho schema mới
    const articlesToInsert = newArticles.map(article => ({
      url: article.url,
      title: article.title,
      description: article.description,
      thumbnail_url: article.thumbnail_url,
      source_id: SOURCE_MAPPING[article.source]?.id || null,
      category_id: article.category_id,
      published_at: article.published_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log('Dữ liệu chuẩn bị upsert:', articlesToInsert.slice(0, 2)); // Log 2 bài đầu tiên

    // Upsert vào bảng articles (dựa trên url)
    const { error } = await supabase
      .from('articles')
      .upsert(articlesToInsert, { onConflict: 'url' });
    if (error) {
      console.error('Lỗi khi upsert articles vào database:', error.message);
      console.error('Chi tiết lỗi:', error);
    } else {
      console.log(`Đã upsert ${articlesToInsert.length} articles vào database.`);
    }
  } else {
    console.log('Không có bài viết mới');
  }
  
  const duration = Date.now() - startTime;
  console.log(`Thời gian crawl: ${duration}ms`);
}

// Hàm cập nhật cache theo category
function updateCategoryCache() {
  // Xóa cache cũ
  Object.keys(categoryCache).forEach(key => delete categoryCache[key]);
  
  // Tạo cache mới theo category
  globalCache.articles.forEach(article => {
    const categoryId = article.category_id;
    if (!categoryCache[categoryId]) {
      categoryCache[categoryId] = [];
    }
    categoryCache[categoryId].push(article);
  });
  
  // Sắp xếp mỗi category theo thời gian
  Object.keys(categoryCache).forEach(categoryId => {
    categoryCache[categoryId].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  });
}

// Hàm khởi tạo crawl lần đầu
async function initializeCrawl() {
  console.log('Khởi tạo crawl lần đầu...');
  
  // Đảm bảo news_sources table được tạo trước khi crawl
  await ensureNewsSourcesTable();
  
  await crawlAllFeeds();
  
  // Bắt đầu crawl định kỳ
  setInterval(crawlAllFeeds, CRAWL_INTERVAL);
  console.log(`Đã thiết lập crawl tự động mỗi ${CRAWL_INTERVAL / 1000 / 60} phút`);
}

// Hàm lấy dữ liệu cho client
function getArticles(category_id, page = 1, limit = 20) {
  let articles;
  
  if (category_id) {
    // Lấy theo category
    articles = categoryCache[category_id] || [];
  } else {
    // Lấy tất cả
    articles = globalCache.articles;
  }
  
  // Phân trang
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArticles = articles.slice(startIndex, endIndex);
  
  return {
    articles: paginatedArticles,
    total: articles.length,
    page,
    limit,
    hasMore: endIndex < articles.length
  };
}

// Khởi tạo crawl khi module được load
initializeCrawl();

module.exports = {}; // Không export getArticles nữa, chỉ dùng database