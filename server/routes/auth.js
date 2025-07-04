const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');


// Đăng ký
router.post('/register', async (req, res) => {
    const { email, password, full_name, avatar_url } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  
    // 1. Đăng ký với Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
  
    const user = data.user;
    if (!user) return res.status(500).json({ error: 'User not created' });
  
    // 2. Thêm vào bảng user_info
    const { error: infoError } = await supabase
      .from('user_info')
      .insert([
        {
          id: user.id,
          full_name: full_name || null,
          avatar_url: avatar_url || null,
        }
      ]);

    if (infoError) {
        console.error('Insert user_info error: ', infoError);
        return res.status(500).json({ error: infoError.message });
    }
  
    // 3. Lấy lại thông tin user_info
    const { data: info } = await supabase
      .from('user_info')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    return res.json({ user: { ...user, ...info } });
  });

// Đăng nhập
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // Lấy thêm thông tin user_info
  let info = {};
  if (data.user && data.user.id) {
    const { data: infoData } = await supabase
      .from('user_info')
      .select('full_name, avatar_url')
      .eq('id', data.user.id)
      .single();
    if (infoData) info = infoData;
  }

  return res.json({ user: { ...data.user, ...info }, access_token: data.session?.access_token });
});

module.exports = router; 