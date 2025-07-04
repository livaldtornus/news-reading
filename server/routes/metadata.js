const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');

// GET /api/metadata?page=1&pageSize=20&category_id=...&source_id=...
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const category_id = req.query.category_id;
  const source_id = req.query.source_id;
  const q = req.query.q;

  try {
    let query = supabase
      .from('articles')
      .select(`
        *,
        news_sources (
          id,
          name,
          icon_url
        )
      `, { count: 'exact' })
      .order('published_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (category_id) query = query.eq('category_id', category_id);
    if (source_id) query = query.eq('source_id', source_id);
    if (q) query = query.ilike('title', `%${q}%`);

    const { data, error, count } = await query;
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Transform data to include source name and icon
    const transformedData = data.map(article => ({
      ...article,
      source: article.news_sources?.name || null,
      source_icon: article.news_sources?.icon_url || null
    }));
    
    return res.json({ articles: transformedData, total: count });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 