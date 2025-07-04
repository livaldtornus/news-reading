const express = require('express');
const router = express.Router();
const { fetchArticleContent } = require('../services/getDetail');

// GET /api/detailData?url=...
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'Missing url parameter' });
  try {
    const result = await fetchArticleContent(url);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 