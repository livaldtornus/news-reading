import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';
import { JSDOM } from 'jsdom';

const API_BASE = 'http://192.168.0.103:3001/api';

// Client-side cache
const clientCache = {
  data: new Map<string, any>(),
  timestamps: new Map<string, number>(),
};

// Preload queue để quản lý việc preload
const preloadQueue = new Map<string, Promise<any>>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

// Hàm tạo cache key
function getCacheKey(category_id: number, page: number, limit: number): string {
  return `${category_id}-${page}-${limit}`;
}

// Hàm kiểm tra cache còn hạn không
function isCacheValid(cacheKey: string): boolean {
  const timestamp = clientCache.timestamps.get(cacheKey);
  if (!timestamp) return false;
  
  const now = Date.now();
  return (now - timestamp) < CACHE_DURATION;
}

// Hàm lưu vào cache
function saveToCache(cacheKey: string, data: any): void {
  clientCache.data.set(cacheKey, data);
  clientCache.timestamps.set(cacheKey, Date.now());
}

// Hàm lấy từ cache
function getFromCache(cacheKey: string): any | null {
  if (isCacheValid(cacheKey)) {
    return clientCache.data.get(cacheKey);
  }
  return null;
}

// Hàm preload bài viết (chạy background)
async function preloadArticles(category_id: number, page: number, limit: number = 20): Promise<any> {
  const cacheKey = getCacheKey(category_id, page, limit);

  // Kiểm tra cache trước
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Kiểm tra xem đang preload chưa
  if (preloadQueue.has(cacheKey)) {
    return preloadQueue.get(cacheKey);
  }

  // Tạo promise để preload
  const preloadPromise = (async () => {
    try {
      console.log(`Preloading category ${category_id}, page ${page}`);
      const url = `${API_BASE}/metadata?category_id=${category_id}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      const articles = json.articles || [];
      saveToCache(cacheKey, articles);

      console.log(`Preloaded ${articles.length} articles for category ${category_id}, page ${page}`);
      return articles;
    } catch (error) {
      // Nếu chỉ là hết dữ liệu, trả về mảng rỗng thay vì throw
      console.error(`Preload error for category ${category_id}, page ${page}:`, error);
      return [];
    } finally {
      preloadQueue.delete(cacheKey);
    }
  })();

  preloadQueue.set(cacheKey, preloadPromise);

  return preloadPromise;
}

// Hàm preload nhiều trang cùng lúc
export async function preloadMultiplePages(category_id: number, startPage: number, count: number = 3): Promise<void> {
  const preloadPromises: Promise<any>[] = [];
  
  for (let i = 1; i <= count; i++) {
    const page = startPage + i;
    preloadPromises.push(preloadArticles(category_id, page).catch(err => {
      console.error(`Failed to preload page ${page}:`, err);
      return null;
    }));
  }
  
  // Chạy song song, không cần chờ kết quả
  Promise.all(preloadPromises).then(() => {
    console.log(`Completed preloading ${count} pages for category ${category_id}`);
  });
}

export async function fetchArticles(category_id: number, page = 1, limit = 20) {
    const cacheKey = getCacheKey(category_id, page, limit);
    
    // Kiểm tra cache trước
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
        console.log(`Lấy dữ liệu từ cache cho category ${category_id}, page ${page}`);
        // Preload trang tiếp theo nếu đang ở trang đầu
        if (page === 1) {
          preloadMultiplePages(category_id, page, 3);
        }
        return cachedData;
    }
    
    // Nếu không có cache hoặc cache hết hạn, gọi API
    console.log(`Gọi API cho category ${category_id}, page ${page}`);
    const url = `${API_BASE}/metadata?category_id=${category_id}&page=${page}&limit=${limit}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    // Server trả về { articles, total }
    const articles = json.articles || [];
    // Lưu vào cache
    saveToCache(cacheKey, articles);
    // Preload trang tiếp theo
    if (articles.length > 0) {
      preloadMultiplePages(category_id, page, 3);
    }
    return articles;
}

// Hàm xóa cache (có thể dùng để force refresh)
export function clearCache(): void {
    clientCache.data.clear();
    clientCache.timestamps.clear();
    preloadQueue.clear();
    console.log('Đã xóa cache và preload queue');
}

// Hàm xóa cache cho category cụ thể
export function clearCategoryCache(category_id: number): void {
    const keysToDelete: string[] = [];
    for (const key of clientCache.data.keys()) {
        if (key.startsWith(`${category_id}-`)) {
            keysToDelete.push(key);
        }
    }
    
    keysToDelete.forEach(key => {
        clientCache.data.delete(key);
        clientCache.timestamps.delete(key);
        preloadQueue.delete(key);
    });
    
    console.log(`Đã xóa cache cho category ${category_id}`);
}

// Hàm lấy trạng thái preload
export function getPreloadStatus(): { cacheSize: number; queueSize: number } {
    return {
        cacheSize: clientCache.data.size,
        queueSize: preloadQueue.size,
    };
}

// export async function fetchArticleDetail(url: string) {
//   const apiUrl = `${API_BASE}/detailData?url=${encodeURIComponent(url)}`;
//   const res = await fetch(apiUrl);
//   const json = await res.json();
//   if (!json.success) throw new Error(json.error || 'Fetch detail failed');
//   return json.data;
// }

// Crawl chi tiết bài viết ngay trên client
export async function fetchArticleDetailClient(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const handler = new DomHandler((error, dom) => {
      if (error) throw error;
    });
    const parser = new Parser(handler, { decodeEntities: true });
    parser.write(html);
    parser.end();
    const dom = handler.dom;
    const items = [];

    function findContentNode(nodes) {
      for (const node of nodes) {
        if (
          node.attribs &&
          (
            node.attribs.class?.includes('fck_detail') ||
            node.attribs.class?.includes('detail-content') ||
            node.attribs.class?.includes('article__body') ||
            node.attribs.class?.includes('singular-content') ||
            node.attribs.class?.includes('maincontent') ||
            node.attribs.class?.includes('e-magazine__body')
          )
        ) {
          return node;
        }
        if (node.children) {
          const found = findContentNode(node.children);
          if (found) return found;
        }
      }
      return null;
    }

    function extractContent(node) {
      for (const child of node.children || []) {
        if (child.type === 'tag') {
          const tag = child.name.toLowerCase();
          if (['p', 'h1', 'h2', 'h3'].includes(tag)) {
            const text = getText(child).trim();
            const htmlContent = getHtml(child);
            if (text) items.push({ type: 'text', text, html: htmlContent });
          } else if (tag === 'figure') {
            const img = findTag(child, 'img');
            const caption = getText(findTag(child, 'figcaption')).trim() || '';
            const src = img?.attribs?.['data-src'] || img?.attribs?.['data-original'] || img?.attribs?.src;
            if (src) items.push({ type: 'image', url: src, caption });
          } else if (tag === 'div' && child.attribs?.class?.includes('VCSortableInPreviewMode')) {
            const figures = findAllTags(child, 'img');
            const caption = getText(findTag(child, 'figcaption')).trim();
            for (const img of figures) {
              const src = img.attribs?.['data-original'] || img.attribs?.src;
              if (src) items.push({ type: 'image', url: src, caption });
            }
          }
        }
      }
    }

    function getText(node) {
      if (!node) return '';
      if (node.type === 'text') return node.data;
      if (!node.children) return '';
      return node.children.map(getText).join('');
    }

    function getHtml(node) {
      if (!node) return '';
      if (node.type === 'text') return node.data;
      if (node.type === 'tag') {
        const attrs = node.attribs 
          ? Object.entries(node.attribs)
              .map(([key, value]) => ` ${key}="${value}"`)
              .join('')
          : '';
        const children = node.children ? node.children.map(getHtml).join('') : '';
        return `<${node.name}${attrs}>${children}</${node.name}>`;
      }
      return '';
    }

    function findTag(node, tag) {
      if (!node) return null;
      if (node.type === 'tag' && node.name === tag) return node;
      for (const child of node.children || []) {
        const found = findTag(child, tag);
        if (found) return found;
      }
      return null;
    }

    function findAllTags(node, tag) {
      const results = [];
      function search(n) {
        if (n.type === 'tag' && n.name === tag) results.push(n);
        for (const c of n.children || []) search(c);
      }
      search(node);
      return results;
    }

    const contentNode = findContentNode(dom);
    if (contentNode) {
      extractContent(contentNode);
    }

    if (items.length === 0) {
      return { items: [{ type: 'text', text: 'Không tìm thấy nội dung bài viết.' }] };
    }

    return { items };
  } catch (e) {
    return { items: [{ type: 'text', text: `Không thể tải bài viết: ${e.message}` }] };
  }
  }
