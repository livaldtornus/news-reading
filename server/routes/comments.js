const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');

// GET /api/comments?article_url=...
router.get('/', async (req, res) => {
  const { article_url } = req.query;
  if (!article_url) return res.status(400).json({ error: 'Missing article_url' });
  
  try {
    // Lấy comment kèm thông tin user
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, 
        content, 
        created_at, 
        user_info (
          full_name, 
          avatar_url
        )
      `)
      .eq('article_url', article_url)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.json({ comments: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/comments
router.post('/', async (req, res) => {
  const { access_token, article_url, content } = req.body;
  
  if (!access_token || !article_url || !content) {
    return res.status(400).json({ error: 'Missing access_token, article_url, or content' });
  }

  try {
    // Xác thực user từ access_token
    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid access_token' });
    }

    // Thêm comment
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          article_url,
          user_id: user.id,
          content: content.trim(),
        }
      ])
      .select(`
        id, 
        content, 
        created_at, 
        user_info (
          full_name, 
          avatar_url
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating comment:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.json({ comment: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 